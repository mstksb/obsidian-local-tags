import { FileView, MarkdownView, editorInfoField } from 'obsidian';
import type { App, Editor, TFile, WorkspaceLeaf } from 'obsidian';
import type { EditorView } from '@codemirror/view';
import { PrivateTagIndex } from '../domain/index.ts';
import { parse } from '../domain/parser.ts';
import { commitTags, documentField } from '../editor/state.ts';
import type { DocumentModel } from '../editor/state.ts';

export class CurrentDocumentController {
  readonly index = new PrivateTagIndex();
  private readonly editorViews = new Set<EditorView>();
  private readonly listeners = new Set<() => void>();
  private currentFile: TFile | null = null;
  private documentModel: DocumentModel | null = null;
  private activeView: EditorView | null = null;
  private generation = 0;
  private disposed = false;

  constructor(readonly app: App) {}

  get views(): ReadonlySet<EditorView> {
    return this.editorViews;
  }

  get file(): TFile | null {
    return this.currentFile;
  }

  get model(): Readonly<DocumentModel> | null {
    return this.documentModel;
  }

  get currentView(): EditorView | null {
    return this.activeView;
  }

  attachView(view: EditorView): void {
    this.editorViews.add(view);
  }

  detachView(view: EditorView): void {
    this.editorViews.delete(view);
    if (this.activeView === view) this.activeView = null;
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  observe(view: EditorView): void {
    queueMicrotask(() => {
      if (
        this.disposed ||
        !this.editorViews.has(view) ||
        view.dom?.parentElement?.closest('.cm-editor')
      )
        return;
      const info = view.state.field(editorInfoField, false);
      if (!info?.file || info.file.extension !== 'md') return;
      if (view.hasFocus && (this.activeView !== view || this.currentFile !== info.file)) {
        this.commitCurrent();
        this.generation++;
        this.currentFile = info.file;
        this.activeView = view;
      }
      if (this.activeView === view && this.currentFile === info.file) {
        const previous = this.documentModel;
        this.documentModel = view.state.field(documentField);
        if (
          previous?.committed !== this.documentModel.committed ||
          this.index.path !== info.file.path
        )
          this.index.replace(info.file.path, this.documentModel.committed);
        this.emit();
      }
    });
  }

  findView(editor?: Editor, file = this.currentFile): EditorView | undefined {
    return [...this.editorViews].find((view) => {
      const info = view.state.field(editorInfoField, false);
      return (
        !view.dom?.parentElement?.closest('.cm-editor') &&
        info?.file === file &&
        (!editor || info.editor === editor)
      );
    });
  }

  modelFor(editor: Editor, file: TFile): DocumentModel | undefined {
    return this.findView(editor, file)?.state.field(documentField);
  }

  async activate(file: TFile | null, editor?: Editor): Promise<void> {
    this.commitCurrent();
    const sameTarget =
      file?.extension === 'md' && file === this.currentFile && file.path === this.index.path;
    const generation = ++this.generation;
    this.currentFile = file?.extension === 'md' ? file : null;
    this.activeView = null;
    this.documentModel = null;
    if (!sameTarget) this.index.replace(this.currentFile?.path ?? null, []);
    this.emit();
    if (!this.currentFile) return;
    const target = this.currentFile;
    const view = this.findView(editor, target);
    if (view) {
      view.dispatch({ effects: commitTags.of(null) });
      this.activeView = view;
      this.documentModel = view.state.field(documentField);
    } else {
      const source = editor ? editor.getValue() : await this.app.vault.cachedRead(target);
      if (this.disposed || generation !== this.generation) return;
      const candidates = parse(source);
      this.documentModel = {
        candidates,
        pending: [],
        committed: candidates.filter((item) => item.kind === 'valid'),
      };
    }
    this.index.replace(target.path, this.documentModel.committed);
    this.emit();
  }

  async followLeaf(leaf: WorkspaceLeaf | null): Promise<void> {
    if (leaf?.view instanceof MarkdownView) {
      if (
        leaf.view.file !== this.currentFile ||
        this.findView(leaf.view.editor) !== this.activeView
      ) {
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
    if (!this.activeView || !this.editorViews.has(this.activeView)) return;
    if (this.activeView.state.field(documentField).pending.length > 0) {
      this.activeView.dispatch({ effects: commitTags.of(null) });
    }
    this.documentModel = this.activeView.state.field(documentField);
    this.index.replace(this.currentFile?.path ?? null, this.documentModel.committed);
  }

  refresh(): void {
    if (this.currentFile)
      this.index.replace(this.currentFile.path, this.documentModel?.committed ?? []);
    this.emit();
  }

  private emit(): void {
    for (const callback of this.listeners) callback();
  }

  dispose(): void {
    this.disposed = true;
    this.generation++;
    this.listeners.clear();
    this.editorViews.clear();
    this.activeView = null;
    this.currentFile = null;
    this.documentModel = null;
    this.index.replace(null, []);
  }
}
