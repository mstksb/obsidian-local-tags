import type { App, MarkdownView, TFile } from 'obsidian';
import type { EditorView } from '@codemirror/view';
import type { StateEffect } from '@codemirror/state';
import { foldedRanges, unfoldEffect } from '@codemirror/language';
import { NavigationCycle, navigationCandidates } from '../domain/navigation.ts';
import type { NavigationMatch, NavigationTarget } from '../domain/navigation.ts';
import { readingLocation } from '../reading.ts';
import { navigationHighlight, setNavigationHighlight } from '../editor/navigation-highlight.ts';
import { RenderedNavigationHighlight } from './navigation-highlight.ts';
import type { CurrentDocumentController } from './controller.ts';

interface Request extends NavigationTarget {
  pane: MarkdownView;
  file: TFile;
  generation: number;
}

export class TagNavigation {
  private target: MarkdownView | null = null;
  private targetFile: TFile | null = null;
  private targetPath = '';
  private targetMode = '';
  private generation = 0;
  private disposed = false;
  private queue: Promise<void> = Promise.resolve();
  private readonly cycle = new NavigationCycle();
  private renderedHighlight?: RenderedNavigationHighlight;
  private editorHighlight?: EditorView;

  constructor(
    private readonly app: App,
    private readonly controller: CurrentDocumentController,
  ) {}

  track(view: MarkdownView | null): void {
    if (this.disposed) return;
    const file = view?.file ?? null;
    const mode = view ? this.mode(view) : '';
    if (
      this.target === view &&
      this.targetFile === file &&
      this.targetPath === (file?.path ?? '') &&
      this.targetMode === mode
    )
      return;
    this.invalidate();
    this.target = view;
    this.targetFile = file;
    this.targetPath = file?.path ?? '';
    this.targetMode = mode;
  }

  refresh(): void {
    if (!this.target) return;
    this.track(this.isOpen(this.target) ? this.target : null);
  }

  sourceModified(file: TFile): void {
    if (this.target?.file === file && this.target.getMode() === 'preview') this.invalidate();
  }

  navigate(tag: string, path: string): Promise<void> {
    if (this.disposed) return Promise.resolve();
    this.controller.commitCurrent();
    const view = this.target;
    const file = view?.file;
    if (!view || !file || file.path !== path || !this.isOpen(view))
      return Promise.reject(new Error('No target Markdown pane is available.'));
    // Snapshot every click before it waits behind a preceding Reading render.
    const request: Request = {
      pane: view,
      file,
      path,
      source: view.getViewData(),
      tag,
      mode: this.mode(view),
      generation: this.generation,
    };
    const operation = this.queue.then(() => this.move(request));
    this.queue = operation.catch(() => {});
    return operation;
  }

  invalidate(): void {
    this.generation++;
    this.cycle.reset();
    this.clearHighlights();
  }

  dispose(): void {
    this.disposed = true;
    this.invalidate();
    this.target = null;
    this.targetFile = null;
  }

  private mode(view: MarkdownView): string {
    // `source` distinguishes Source and Live Preview within getMode()=source.
    return `${view.getMode()}:${String(view.leaf?.getViewState?.().state?.source)}`;
  }

  private isOpen(view: MarkdownView): boolean {
    return this.app.workspace.getLeavesOfType('markdown').some((leaf) => leaf.view === view);
  }

  private current(request: Request): boolean {
    return (
      !this.disposed &&
      request.generation === this.generation &&
      this.target === request.pane &&
      this.controller.file === request.file &&
      request.pane.file === request.file &&
      request.file.path === request.path &&
      this.mode(request.pane) === request.mode &&
      request.pane.getViewData() === request.source &&
      this.isOpen(request.pane)
    );
  }

  private async move(request: Request): Promise<void> {
    if (!this.current(request)) return;
    const reading = request.pane.getMode() === 'preview';
    const candidates = navigationCandidates(request.source, request.tag, reading);
    const match = this.cycle.prepare(request, candidates);
    if (!match) {
      this.cycle.reset();
      this.clearHighlights();
      throw new Error(
        reading
          ? 'No visible tag occurrence is available. Check the note in editing mode.'
          : 'No matching tag occurrence is available in this note.',
      );
    }
    try {
      this.clearHighlights();
      if (reading) {
        if (!(await this.moveReading(request, match))) return;
      } else this.moveEditor(request, match);
      if (!this.current(request)) {
        this.clearHighlights();
        return;
      }
      this.cycle.commit(request, match);
    } catch (error) {
      this.clearHighlights();
      throw error;
    }
  }

  private moveEditor(request: Request, match: NavigationMatch): void {
    const { pane, file } = request;
    const { from, to } = match.candidate;
    const cm = this.controller.findView(pane.editor, file);
    if (!cm || cm.state.field(navigationHighlight, false) === undefined)
      throw new Error('The editor highlight is unavailable. Reopen the Markdown pane.');
    if (!this.current(request)) return;
    const effects: StateEffect<unknown>[] = [
      setNavigationHighlight.of({ path: request.path, from, to }),
    ];
    foldedRanges(cm.state).between(from, to, (start, end) => {
      effects.push(unfoldEffect.of({ from: start, to: end }));
    });
    cm.dispatch({ effects });
    this.editorHighlight = cm;
    if (!this.current(request)) return;
    const start = pane.editor.offsetToPos(from);
    const end = pane.editor.offsetToPos(to);
    pane.editor.scrollIntoView({ from: start, to: end }, true);
    this.renderedHighlight = new RenderedNavigationHighlight(
      cm.contentDOM,
      { path: request.path, from, to },
      () => this.current(request),
    );
  }

  private async moveReading(request: Request, match: NavigationMatch): Promise<boolean> {
    const { pane, source } = request;
    const { from, to } = match.candidate;
    const line = source.slice(0, from).split('\n').length - 1;
    // Obsidian's runtime line hint reveals virtualized and folded sections.
    pane.setEphemeralState({ line });
    const root = pane.previewMode.containerEl;
    this.clearReadingFlash(root);
    const deadline = Date.now() + 2000;
    const expanded = new WeakSet<HTMLElement>();
    while (Date.now() < deadline) {
      if (!this.current(request)) return false;
      this.clearReadingFlash(root);
      const markers = [...root.querySelectorAll<HTMLElement>('[data-local-tags-reading]')].filter(
        (element) => {
          if (element.closest('.markdown-embed,.internal-embed')) return false;
          const location = readingLocation(element);
          return (
            location?.path === request.path &&
            location.from === from &&
            location.to === to &&
            location.isCurrent()
          );
        },
      );
      for (const marker of markers) {
        const ancestors: HTMLElement[] = [];
        for (
          let parent = marker.parentElement;
          parent && parent !== root;
          parent = parent.parentElement
        )
          ancestors.unshift(parent);
        for (const parent of ancestors) {
          if (!parent.matches('.callout.is-collapsed') || expanded.has(parent)) continue;
          const title = parent.querySelector<HTMLElement>(':scope > .callout-title');
          if (title) {
            expanded.add(parent);
            title.click();
          }
        }
      }
      if (!this.current(request)) return false;
      // Opening a callout may synchronously rerender or invalidate its markers.
      const ready = markers.filter(
        (element) => root.contains(element) && readingLocation(element)?.isCurrent(),
      );
      const visible = ready.find((element) => element.getClientRects().length);
      if (visible) {
        this.renderedHighlight = new RenderedNavigationHighlight(
          root,
          { path: request.path, from, to },
          () => this.current(request),
        );
        visible.scrollIntoView({ block: 'center', inline: 'nearest' });
        this.clearReadingFlash(root);
        return true;
      }
      await new Promise<void>((resolve) => root.win.setTimeout(resolve, 25));
    }
    throw new Error('The tag occurrence could not be displayed. Check the note in editing mode.');
  }

  private clearHighlights(): void {
    this.renderedHighlight?.dispose();
    this.renderedHighlight = undefined;
    if (
      this.editorHighlight &&
      this.controller.views.has(this.editorHighlight) &&
      this.editorHighlight.state.field(navigationHighlight, false)
    )
      this.editorHighlight.dispatch({ effects: setNavigationHighlight.of(null) });
    this.editorHighlight = undefined;
  }

  private clearReadingFlash(root: HTMLElement): void {
    // The runtime line hint also flashes a whole section (Obsidian 1.14.4/1.14.5).
    // Keep its folding/virtualization behavior, replacing only this pane's flash.
    for (const element of root.querySelectorAll('.is-flashing'))
      element.classList.remove('is-flashing');
  }
}
