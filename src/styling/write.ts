import type { App, Editor, MarkdownView, TFile } from 'obsidian';
import { transform } from './document.ts';
import type { Operation } from './types.ts';

export interface WriteResult {
  route: 'editor' | 'vault';
  changed: boolean;
  before: string;
  after: string;
}

interface EditorTarget {
  view: MarkdownView;
  editor: Editor;
}

export function changedRange(before: string, after: string) {
  let from = 0;
  while (from < before.length && before[from] === after[from]) from++;
  let to = before.length;
  let end = after.length;
  while (to > from && end > from && before[to - 1] === after[end - 1]) {
    to--;
    end--;
  }
  return { from, to, insert: after.slice(from, end) };
}

/** Serializes this feature's edits; the editor and Vault remain authoritative. */
export class DocumentWriter {
  private readonly queues = new Map<TFile, Promise<unknown>>();
  private readonly app: App;
  private disposed = false;

  constructor(app: App) {
    this.app = app;
  }

  write(file: TFile, operation: Operation, origin?: Editor): Promise<WriteResult> {
    if (this.disposed)
      return Promise.reject(new Error('Tag styling was disabled. The update was canceled.'));
    const target = this.editorTarget(file, origin);
    if (origin && !target)
      return Promise.reject(
        new Error('The target editor was closed or changed. The update was canceled.'),
      );
    return this.runExclusive(file, async () => {
      if (target && !this.isCurrentTarget(file, target))
        throw new Error('The target editor was closed while waiting. The update was canceled.');
      return this.apply(file, operation, target);
    });
  }

  /** Serialize updates to the same file, including synchronous reentry. */
  runExclusive<T>(file: TFile, task: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(file);
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason: unknown) => void;
    const pending = new Promise<T>((done, fail) => {
      resolve = done;
      reject = fail;
    });
    // Register before invoking task so even synchronous reentry sees this work.
    this.queues.set(file, pending);
    void pending
      .finally(() => {
        if (this.queues.get(file) === pending) this.queues.delete(file);
      })
      .catch(() => {});
    const run = () => {
      try {
        this.assertWritable(file);
        resolve(task());
      } catch (error) {
        reject(error);
      }
    };
    // With no queued work, reach editor transactions in the caller's turn.
    if (previous) void previous.catch(() => {}).then(run);
    else run();
    return pending;
  }

  dispose(): void {
    this.disposed = true;
    this.queues.clear();
  }

  private views(file: TFile): MarkdownView[] {
    return this.app.workspace
      .getLeavesOfType('markdown')
      .map((leaf) => leaf.view as MarkdownView)
      .filter((view) => view.file === file);
  }

  private editorTarget(file: TFile, origin?: Editor): EditorTarget | undefined {
    const views = this.views(file).filter((view) => view.getMode() === 'source');
    if (origin) {
      const view = views.find((candidate) => candidate.editor === origin);
      return view ? { view, editor: origin } : undefined;
    }
    const recent = this.app.workspace.getMostRecentLeaf?.(this.app.workspace.rootSplit)?.view;
    const view = views.find((candidate) => candidate === recent) ?? views[0];
    return view ? { view, editor: view.editor } : undefined;
  }

  private isCurrentTarget(file: TFile, target: EditorTarget): boolean {
    return (
      target.view.file === file &&
      target.view.editor === target.editor &&
      target.view.getMode() === 'source' &&
      this.views(file).includes(target.view)
    );
  }

  private assertWritable(file: TFile): void {
    if (this.disposed) throw new Error('Tag styling was disabled. The update was canceled.');
    if (this.app.vault.getFileByPath(file.path) !== file)
      throw new Error('The target file was deleted or replaced. The update was canceled.');
  }

  private async apply(
    file: TFile,
    operation: Operation,
    captured?: EditorTarget,
  ): Promise<WriteResult> {
    this.assertWritable(file);
    const views = this.views(file);
    const sourceViews = views.filter((view) => view.getMode() === 'source');
    const target = captured ?? this.editorTarget(file);
    if (target) {
      // No asynchronous gap is allowed between the buffer snapshot and this edit.
      const before = target.editor.getValue();
      if (sourceViews.some((view) => view.editor.getValue() !== before))
        throw new Error('Editor contents differ. The update was canceled.');
      const after = transform(before, operation);
      if (before !== after) {
        const change = changedRange(before, after);
        target.editor.transaction(
          {
            changes: [
              {
                from: target.editor.offsetToPos(change.from),
                to: target.editor.offsetToPos(change.to),
                text: change.insert,
              },
            ],
          },
          'local-tag-styling',
        );
        await this.waitForEditors(file, target);
      }
      return { route: 'editor', changed: before !== after, before, after };
    }

    // Preview panes may retain a pending save from their previous source mode.
    const pending = views[0]?.getViewData();
    if (views.some((view) => view.getViewData() !== pending))
      throw new Error('Reading pane contents differ. The update was canceled.');
    await Promise.all(views.map((view) => view.save()));
    this.assertWritable(file);
    this.assertVaultViews(file);
    let before = '';
    const after = await this.app.vault.process(file, (source) => {
      // Vault may defer this callback. Check again inside its atomic transaction.
      this.assertWritable(file);
      this.assertVaultViews(file, source);
      before = source;
      return transform(source, operation);
    });
    return { route: 'vault', changed: before !== after, before, after };
  }

  private assertVaultViews(file: TFile, source?: string): void {
    const current = this.views(file);
    if (
      current.some(
        (view) =>
          view.getMode() === 'source' || (source !== undefined && view.getViewData() !== source),
      )
    )
      throw new Error(
        'The view mode or document changed while waiting for a save. The update was canceled.',
      );
    const first = current[0]?.getViewData();
    if (current.some((view) => view.getViewData() !== first))
      throw new Error('Reading pane contents differ. The update was canceled.');
  }

  private async waitForEditors(file: TFile, target: EditorTarget): Promise<void> {
    const window = target.view.containerEl.ownerDocument.win;
    const deadline = Date.now() + 2000;
    while (true) {
      try {
        this.assertWritable(file);
        if (!this.isCurrentTarget(file, target))
          throw new Error('The target editor was closed or its view mode changed.');
      } catch (error) {
        throw new Error(
          `The document was updated, but synchronization could not be verified: ${String(error)}`,
          {
            cause: error,
          },
        );
      }
      const peers = this.views(file).filter((view) => view.getMode() === 'source');
      if (peers.every((view) => view.editor.getValue() === target.editor.getValue())) return;
      if (Date.now() >= deadline)
        throw new Error('The document was updated, but editor synchronization timed out.');
      await new Promise((done) => window.setTimeout(done, 20));
    }
  }
}
