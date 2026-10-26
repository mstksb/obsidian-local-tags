import { FileView, MarkdownView, editorInfoField } from 'obsidian';
import type { App, Editor, TFile, WorkspaceLeaf } from 'obsidian';
import type { EditorView } from '@codemirror/view';
import { PrivateTagIndex } from '../domain/index.ts';
import { parse } from '../domain/parser.ts';
import { commitTags, documentField } from '../editor/state.ts';
import type { DocumentModel } from '../editor/state.ts';

export class CurrentDocumentController {
  readonly index = new PrivateTagIndex();
  readonly views = new Set<EditorView>();
  readonly listeners = new Set<() => void>();
  file: TFile | null = null;
  model: DocumentModel | null = null;
  currentView: EditorView | null = null;
  private generation = 0;
  private disposed = false;

  constructor(readonly app: App) {}

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  observe(view: EditorView): void {
    queueMicrotask(() => {
      if (this.disposed || !this.views.has(view)) return;
      const info = view.state.field(editorInfoField, false);
      if (!info?.file || info.file.extension !== 'md') return;
      if (view.hasFocus && (this.currentView !== view || this.file !== info.file)) {
        this.commitCurrent();
        this.generation++;
        this.file = info.file;
        this.currentView = view;
      }
      if (this.currentView === view && this.file === info.file) {
        this.model = view.state.field(documentField);
        this.index.replace(info.file.path, this.model.committed);
        this.emit();
      }
    });
  }

  findView(editor?: Editor, file = this.file): EditorView | undefined {
    return [...this.views].find((view) => {
      const info = view.state.field(editorInfoField, false);
      return info?.file === file && (!editor || info.editor === editor);
    });
  }

  modelFor(editor: Editor, file: TFile): DocumentModel | undefined {
    return this.findView(editor, file)?.state.field(documentField);
  }

  async activate(file: TFile | null, editor?: Editor): Promise<void> {
    this.commitCurrent();
    const sameTarget =
      file?.extension === 'md' && file === this.file && file.path === this.index.path;
    const generation = ++this.generation;
    this.file = file?.extension === 'md' ? file : null;
    this.currentView = null;
    this.model = null;
    if (!sameTarget) this.index.replace(this.file?.path ?? null, []);
    this.emit();
    if (!this.file) return;
    const target = this.file;
    const view = this.findView(editor, target);
    if (view) {
      view.dispatch({ effects: commitTags.of(null) });
      this.currentView = view;
      this.model = view.state.field(documentField);
    } else {
      const source = editor ? editor.getValue() : await this.app.vault.cachedRead(target);
      if (this.disposed || generation !== this.generation) return;
      const candidates = parse(source);
      this.model = {
        candidates,
        pending: [],
        committed: candidates.filter((item) => item.kind === 'valid'),
      };
    }
    this.index.replace(target.path, this.model.committed);
    this.emit();
  }

  async followLeaf(leaf: WorkspaceLeaf | null): Promise<void> {
    if (leaf?.view instanceof MarkdownView) {
      if (leaf.view.file !== this.file || this.findView(leaf.view.editor) !== this.currentView) {
        await this.activate(leaf.view.file, leaf.view.editor);
      }
    } else if (leaf?.view instanceof FileView || leaf?.view.getViewType() === 'empty') {
      await this.activate(null);
    } else {
      // Search and side panels don't replace the Markdown target.
      this.commitCurrent();
      this.emit();
    }
  }

  commitCurrent(): void {
    if (!this.currentView || !this.views.has(this.currentView)) return;
    if (this.currentView.state.field(documentField).pending.length > 0) {
      this.currentView.dispatch({ effects: commitTags.of(null) });
    }
    this.model = this.currentView.state.field(documentField);
    this.index.replace(this.file?.path ?? null, this.model.committed);
  }

  refresh(): void {
    if (this.file) this.index.replace(this.file.path, this.model?.committed ?? []);
    this.emit();
  }

  private emit(): void {
    for (const callback of this.listeners) callback();
  }

  dispose(): void {
    this.disposed = true;
    this.generation++;
    this.listeners.clear();
    this.views.clear();
    this.currentView = null;
    this.file = null;
    this.model = null;
    this.index.replace(null, []);
  }
}
