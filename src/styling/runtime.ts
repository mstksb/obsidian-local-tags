import { MarkdownView, TFile, editorInfoField } from 'obsidian';
import type { App, Editor, Plugin } from 'obsidian';
import { Decoration, EditorView, ViewPlugin } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { StateEffect } from '@codemirror/state';
import type { EditorState, Extension } from '@codemirror/state';
import { documentField, isEditing } from '../editor/state.ts';
import type { CurrentDocumentController } from '../services/controller.ts';
import type { LocalTagsSettings } from '../settings.ts';
import type { ReadingDocument } from '../reading-source.ts';
import { contrastRatio, resolveStyle, styleProperties } from './appearance.ts';
import { parse } from '../domain/parser.ts';
import { readDefinitions, tagAtPosition } from './document.ts';
import {
  closeStylingPickers,
  foldSettings,
  settingsSnapshot,
  stylingEditorExtension,
} from './editor.ts';
import type { Diagnostic, Operation, PaletteOptions, RandomOptions, TagStyle } from './types.ts';
import { StylingPanel } from './panel.ts';
import type { PanelAction } from './panel.ts';
import { DocumentWriter } from './write.ts';

type SourceOverride =
  | { kind: 'editor'; source: string; editor: Editor }
  | { kind: 'reading'; document: ReadingDocument };

interface FileState {
  source?: string;
  definitions: Map<string, TagStyle>;
  lastGood: Map<string, TagStyle>;
  fallbackTags: Set<string>;
  diagnostics: Diagnostic[];
  names: string[];
}

interface Panel {
  view: StylingPanel;
  controller: CurrentDocumentController;
  unsubscribe: () => void;
}

interface StyledRoot {
  root: HTMLElement;
  file: TFile | null;
  observer: MutationObserver;
  definitions?: Map<string, TagStyle>;
  fallbackTags?: Set<string>;
  basicStyle: TagStyle;
  basicKey: string;
  properties: Map<string, Record<string, string>>;
  elements: Set<HTMLElement>;
}

const refreshEditorStyling = StateEffect.define<null>();
const tagSelector = 'span.local-tags-tag[data-local-tag],a.local-tags-tree-link[data-local-tag]';
const clearedStyleProperties = Object.fromEntries(
  Object.keys(styleProperties({})).map((property) => [property, '']),
);

export class StylingFeature {
  private readonly app: App;
  private readonly owner: Plugin;
  private readonly settings: () => LocalTagsSettings;
  private readonly writer: DocumentWriter;
  private readonly states = new Map<TFile, FileState>();
  private readonly scopes = new Map<TFile, string>();
  private readonly generations = new Map<TFile, object>();
  private readonly roots = new Map<HTMLElement, StyledRoot>();
  private readonly editors = new Set<EditorView>();
  private editorRefreshScheduled = false;
  private readonly panels = new Set<Panel>();
  private readonly pending = new Map<TFile, number>();
  private serial = 0;
  private active = true;
  private started = false;
  private readonly randomOptions: RandomOptions = {
    bold: false,
    italic: false,
    underline: false,
  };
  private readonly palette: PaletteOptions = {
    pattern: 'vivid',
    harmony: 'complementary',
  };

  constructor(app: App, owner: Plugin, settings: () => LocalTagsSettings) {
    this.app = app;
    this.owner = owner;
    this.settings = settings;
    this.writer = new DocumentWriter(app);
  }

  start(): void {
    if (!this.active || this.started) return;
    this.started = true;
    this.owner.registerEditorExtension([
      this.editorStylingExtension(),
      stylingEditorExtension(
        (file, operation, view) => {
          const editor = view.state.field(editorInfoField, false)?.editor;
          if (
            !this.active ||
            !editor ||
            !view.dom.isConnected ||
            view.state.field(editorInfoField, false)?.file !== file ||
            !this.views(file).some(
              (candidate) => candidate.getMode() === 'source' && candidate.editor === editor,
            )
          )
            return Promise.reject(new Error('The target editor has changed.'));
          return this.write(file, operation, editor);
        },
        (file, error) => this.reportError(file, error),
        () => this.active,
      ),
    ]);
    this.owner.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        closeStylingPickers();
        if (file?.extension === 'md') void this.reload(file);
      }),
    );
    this.owner.registerEvent(this.app.workspace.on('active-leaf-change', () => this.refresh()));
    this.owner.registerEvent(
      this.app.workspace.on('editor-change', (_editor, info) => {
        if (info.file) void this.reload(info.file);
      }),
    );
    this.owner.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile && this.states.has(file)) void this.reload(file);
      }),
    );
    this.owner.registerEvent(
      this.app.workspace.on('layout-change', () => {
        closeStylingPickers();
        this.refresh();
      }),
    );
    this.owner.registerEvent(this.app.vault.on('rename', () => this.refresh()));
    this.owner.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile) {
          this.states.delete(file);
          this.scopes.delete(file);
          this.generations.delete(file);
        }
        this.refresh();
      }),
    );
    this.app.workspace.onLayoutReady(() => {
      if (!this.active) return;
      const files = new Set(this.views().map((view) => view.file));
      for (const file of files) if (file) void this.reload(file);
      this.refresh();
    });
  }

  appearanceChanged(): void {
    this.refresh();
  }

  private views(file?: TFile): MarkdownView[] {
    return this.app.workspace
      .getLeavesOfType('markdown')
      .map((leaf) => leaf.view)
      .filter(
        (view): view is MarkdownView =>
          view instanceof MarkdownView && (!file || view.file === file),
      );
  }

  private state(file: TFile): FileState {
    let state = this.states.get(file);
    if (!state) {
      state = {
        definitions: new Map(),
        lastGood: new Map(),
        fallbackTags: new Set(),
        diagnostics: [],
        names: [],
      };
      this.states.set(file, state);
    }
    return state;
  }

  synchronizeReading(file: TFile, document: ReadingDocument): void {
    if (
      !this.active ||
      !document.isCurrent() ||
      this.app.vault.getFileByPath(file.path) !== file ||
      this.states.get(file)?.source === document.source
    )
      return;
    void this.reload(file, { kind: 'reading', document });
  }

  async reload(file: TFile, sourceOverride?: SourceOverride): Promise<void> {
    if (!this.active || file.extension !== 'md') return;
    const request = {};
    try {
      const views = this.views(file);
      const editors = views.filter((view) => view.getMode() === 'source');
      const origin =
        sourceOverride?.kind === 'editor'
          ? editors.find((view) => view.editor === sourceOverride.editor)
          : undefined;
      if (sourceOverride?.kind === 'editor' && !origin) return;
      if (sourceOverride?.kind === 'reading' && !sourceOverride.document.isCurrent()) return;
      this.generations.set(file, request);
      const overrideSource =
        sourceOverride?.kind === 'reading'
          ? sourceOverride.document.source
          : sourceOverride?.source;
      const source =
        overrideSource ??
        (editors[0]
          ? editors[0].editor.getValue()
          : views[0]
            ? views[0].getViewData()
            : await this.app.vault.read(file));
      if (
        !this.active ||
        this.generations.get(file) !== request ||
        this.app.vault.getFileByPath(file.path) !== file
      )
        return;
      if (editors.some((view) => view !== origin && view.editor.getValue() !== source))
        throw new Error(
          'The editors for this file have different content. Synchronize them before reloading.',
        );
      const parsed = readDefinitions(source);
      if (
        !this.active ||
        this.generations.get(file) !== request ||
        this.app.vault.getFileByPath(file.path) !== file ||
        (sourceOverride?.kind === 'reading' && !sourceOverride.document.isCurrent())
      )
        return;
      const state = this.state(file);
      state.source = source;
      state.diagnostics = parsed.diagnostics;
      state.names = [
        ...new Set(
          parse(source)
            .filter((tag) => tag.kind === 'valid')
            .map((tag) => tag.name),
        ),
      ];
      if (!parsed.ambiguous) {
        const definitions = new Map(parsed.definitions);
        const fallbackTags = new Set<string>();
        for (const name of parsed.invalidTags) {
          const previous = state.lastGood.get(name);
          if (previous) definitions.set(name, previous);
          else fallbackTags.add(name);
        }
        state.definitions = definitions;
        state.fallbackTags = fallbackTags;
        state.lastGood = new Map(definitions);
      }
    } catch (error) {
      if (this.active && this.generations.get(file) === request) {
        const state = this.state(file);
        state.diagnostics = [{ severity: 'error', message: String(error) }];
      }
    }
    this.refresh();
  }

  private reportError(file: TFile, error: unknown): void {
    if (!this.active) return;
    this.state(file).diagnostics = [{ severity: 'error', message: String(error) }];
    this.refresh();
  }

  private editorFor(panel: Panel): EditorView | undefined {
    const file = panel.controller.file;
    if (!file) return;
    const view = panel.controller.currentView ?? panel.controller.findView?.(undefined, file);
    if (
      !view?.dom.isConnected ||
      view.state.field(editorInfoField, false)?.file !== file ||
      !this.views(file).some(
        (candidate) =>
          candidate.getMode() === 'source' &&
          candidate.editor === view.state.field(editorInfoField, false)?.editor,
      )
    )
      return;
    return view;
  }

  private async randomizeFromEditor(file: TFile, editor: Editor): Promise<void> {
    if (editor.listSelections().length !== 1)
      throw new Error('Use a single cursor to choose the target tag.');
    const source = editor.getValue();
    const tag = tagAtPosition(source, editor.posToOffset(editor.getCursor('head')));
    await this.write(
      file,
      {
        ...(tag === null
          ? { kind: 'random', onlyUnset: false }
          : { kind: 'random-tag', tag, expectedSource: source }),
        options: { ...this.randomOptions },
        palette: { ...this.palette },
      },
      editor,
    );
  }

  async write(file: TFile, operation: Operation, origin?: Editor) {
    if (!this.active) throw new Error('Tag decoration is no longer active.');
    this.pending.set(file, (this.pending.get(file) ?? 0) + 1);
    this.refresh();
    try {
      const result = await this.writer.write(file, operation, origin);
      if (this.active) await this.reload(file);
      return result;
    } catch (error) {
      if (this.active)
        this.state(file).diagnostics = [{ severity: 'error', message: String(error) }];
      throw error;
    } finally {
      const count = (this.pending.get(file) ?? 1) - 1;
      if (count > 0) this.pending.set(file, count);
      else this.pending.delete(file);
      this.refresh();
    }
  }

  mountPanel(root: HTMLElement, controller: CurrentDocumentController): () => void {
    const view = new StylingPanel(root, {
      onAction: (action) => this.handlePanelAction(panel, action),
    });
    const panel: Panel = { view, controller, unsubscribe: () => {} };
    panel.unsubscribe = controller.subscribe(() => this.refresh());
    this.panels.add(panel);
    this.refresh();
    return () => this.detachPanel(panel);
  }

  private handlePanelAction(panel: Panel, action: PanelAction): void {
    const { controller } = panel;
    const file = controller.file;
    if (!file || !this.active || this.pending.has(file)) return;
    controller.commitCurrent();
    if (action === 'fold-tags') {
      try {
        const editor = this.editorFor(panel);
        if (!editor) throw new Error('Expand tag headings in editing mode.');
        foldSettings(editor, 'tags');
      } catch (error) {
        this.reportError(file, error);
      }
      return;
    }
    if (action === 'random-tag') {
      const view = this.editorFor(panel);
      const editor = view?.state.field(editorInfoField, false)?.editor;
      const work = editor
        ? this.randomizeFromEditor(file, editor)
        : this.write(file, {
            kind: 'random',
            onlyUnset: false,
            options: { ...this.randomOptions },
            palette: { ...this.palette },
          });
      void work.catch((error) => this.reportError(file, error));
      return;
    }
    void this.write(file, { kind: action }).catch((error) => this.reportError(file, error));
  }

  private detachPanel(panel: Panel): void {
    panel.unsubscribe();
    this.detachRoot(panel.view.root);
    panel.view.dispose();
    this.panels.delete(panel);
  }

  private scope(file: TFile): string {
    let scope = this.scopes.get(file);
    if (!scope) {
      scope = `local-tag-styling-${++this.serial}`;
      this.scopes.set(file, scope);
    }
    return scope;
  }

  private basicStyle(): TagStyle {
    const value = this.settings();
    const style: TagStyle = {};
    if (value.tagTextColor) style['text-color'] = value.tagTextColor;
    if (value.tagBackgroundColor) style['background-color'] = value.tagBackgroundColor;
    if (value.tagBold !== 'default') style.bold = value.tagBold;
    if (value.tagItalic !== 'default') style.italic = value.tagItalic;
    if (value.tagUnderline !== 'default') style.underline = value.tagUnderline;
    return style;
  }

  private editorStylingExtension(): Extension {
    const editors = this.editors;
    const editorStyles = this.editorStyles.bind(this);
    const synchronizeEditor = this.synchronizeEditor.bind(this);
    const plugin = ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        private file: TFile | null | undefined;
        private path: string | undefined;
        private editor: Editor | undefined;
        private doc: EditorState['doc'];
        constructor(readonly view: EditorView) {
          editors.add(view);
          const info = view.state.field(editorInfoField, false);
          this.file = info?.file;
          this.path = this.file?.path;
          this.editor = info?.editor;
          this.doc = view.state.doc;
          this.decorations = editorStyles(view.state);
          synchronizeEditor(view);
        }
        update(update: ViewUpdate): void {
          const info = update.state.field(editorInfoField, false);
          const sourceChanged =
            this.file !== info?.file ||
            this.path !== info?.file?.path ||
            this.editor !== info?.editor ||
            this.doc !== update.state.doc;
          this.file = info?.file;
          this.path = this.file?.path;
          this.editor = info?.editor;
          this.doc = update.state.doc;
          if (sourceChanged) synchronizeEditor(update.view);
          if (
            sourceChanged ||
            update.startState.field(documentField, false) !==
              update.state.field(documentField, false) ||
            update.transactions.some(
              (transaction) =>
                transaction.reconfigured ||
                transaction.effects.some((effect) => effect.is(refreshEditorStyling)),
            )
          )
            this.decorations = editorStyles(update.state);
        }
        destroy(): void {
          editors.delete(this.view);
        }
      },
    );
    return [
      plugin,
      EditorView.outerDecorations.of((view) => view.plugin(plugin)?.decorations ?? Decoration.none),
    ];
  }

  private synchronizeEditor(view: EditorView): void {
    const info = view.state.field(editorInfoField, false);
    const file = info?.file;
    const editor = info?.editor;
    const doc = view.state.doc;
    const path = file?.path;
    if (!this.active || !file || !editor) return;
    queueMicrotask(() => {
      const current = view.state.field(editorInfoField, false);
      if (
        !this.active ||
        !this.editors.has(view) ||
        !view.dom.isConnected ||
        current?.file !== file ||
        current.editor !== editor ||
        file.path !== path ||
        view.state.doc !== doc
      )
        return;
      // Embedded table editors share the note's Editor but contain only a cell.
      const source = view.dom.parentElement?.closest('.cm-editor')
        ? editor.getValue()
        : doc.toString();
      void this.reload(file, { kind: 'editor', source, editor });
    });
  }

  private editorStyles(state: EditorState): DecorationSet {
    if (!this.active) return Decoration.none;
    const file = state.field(editorInfoField, false)?.file;
    if (!file) return Decoration.none;
    const model = state.field(documentField, false);
    if (!model) return Decoration.none;
    const definitions = this.states.get(file);
    const basic = this.basicStyle();
    const properties = new Map<string, string>();
    return Decoration.set(
      model.candidates
        .filter((tag) => tag.kind === 'valid' && !isEditing(model, tag))
        .map((tag) => {
          let style = properties.get(tag.name);
          if (!style) {
            style = Object.entries(
              styleProperties(
                resolveStyle(
                  tag.name,
                  definitions?.definitions ?? new Map<string, TagStyle>(),
                  definitions?.fallbackTags,
                  basic,
                ),
              ),
            )
              .map(([property, value]) => `${property}: ${value}`)
              .join('; ');
            properties.set(tag.name, style);
          }
          return Decoration.mark({
            attributes: { 'data-local-tag-style-editor': 'true', style },
          }).range(tag.from, tag.to);
        }),
      true,
    );
  }

  private refreshEditors(): void {
    if (this.editorRefreshScheduled || !this.editors.size) return;
    this.editorRefreshScheduled = true;
    queueMicrotask(() => {
      this.editorRefreshScheduled = false;
      for (const view of this.editors) view.dispatch({ effects: refreshEditorStyling.of(null) });
      if (!this.active) this.editors.clear();
    });
  }

  private refresh(): void {
    if (!this.active) return;
    const roots = new Map<HTMLElement, TFile | null>();
    const openFiles = new Set<TFile>();
    for (const view of this.views()) {
      roots.set(view.containerEl, view.file);
      if (view.file) openFiles.add(view.file);
    }
    for (const panel of this.panels) {
      const file = panel.controller.file;
      roots.set(panel.view.root, file);
      if (file) openFiles.add(file);
      const editor = this.editorFor(panel);
      let target: string | null = null;
      if (editor && editor.state.selection.ranges.length === 1) {
        const snapshot = settingsSnapshot(editor);
        const tag = tagAtPosition(
          snapshot.source,
          editor.state.selection.main.head,
          snapshot.layout,
        );
        if (tag !== null) target = `##${tag}`;
      }
      panel.view.render({
        scope: file ? this.scope(file) : undefined,
        verticalPadding: this.settings().tagVerticalPadding,
        busy: !file || this.pending.has(file),
        canFold: !!editor,
        caretTarget: target,
        diagnostics: file ? this.diagnostics(file) : [],
      });
    }
    for (const file of this.states.keys()) {
      if (!openFiles.has(file) && !this.pending.has(file)) {
        this.states.delete(file);
        this.scopes.delete(file);
        this.generations.delete(file);
      }
    }
    const basic = this.basicStyle();
    const basicKey = JSON.stringify(basic);
    let editorStylesChanged = false;
    for (const [root, file] of roots)
      if (this.updateRoot(root, file, basic, basicKey)) editorStylesChanged = true;
    if (editorStylesChanged) this.refreshEditors();
    for (const root of this.roots.keys()) if (!roots.has(root)) this.detachRoot(root);
  }

  private updateRoot(
    root: HTMLElement,
    file: TFile | null,
    basic: TagStyle,
    basicKey: string,
  ): boolean {
    let observed = this.roots.get(root);
    if (!observed) {
      const Observer = root.ownerDocument.defaultView?.MutationObserver;
      if (!Observer) return false;
      const created: StyledRoot = {
        root,
        file: null,
        observer: new Observer((records) => this.updateAddedTags(created, records)),
        basicStyle: {},
        basicKey: '',
        properties: new Map(),
        elements: new Set(),
      };
      observed = created;
      this.roots.set(root, observed);
      observed.observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'data-local-tag'],
      });
    }
    const state = file ? this.states.get(file) : undefined;
    const changed =
      observed.file !== file ||
      observed.definitions !== state?.definitions ||
      observed.fallbackTags !== state?.fallbackTags ||
      observed.basicKey !== basicKey;
    if (file) root.dataset.localTagScope = this.scope(file);
    else delete root.dataset.localTagScope;
    if (!changed) return false;
    observed.file = file;
    observed.definitions = state?.definitions;
    observed.fallbackTags = state?.fallbackTags;
    observed.basicStyle = basic;
    observed.basicKey = basicKey;
    observed.properties.clear();
    for (const element of observed.elements)
      if (!file || !root.contains(element) || !element.matches(tagSelector)) {
        this.clearTagStyle(observed, element);
      }
    if (file)
      for (const element of root.querySelectorAll<HTMLElement>(tagSelector))
        this.applyTagStyle(observed, element);
    return true;
  }

  private updateAddedTags(observed: StyledRoot, records: MutationRecord[]): void {
    if (!this.active || this.roots.get(observed.root) !== observed) return;
    const added = new Set<HTMLElement>();
    const removed = new Set<HTMLElement>();
    for (const record of records) {
      if (record.type === 'attributes') {
        const element = record.target as HTMLElement;
        if (element.matches(tagSelector)) added.add(element);
        else if (observed.elements.has(element)) removed.add(element);
        continue;
      }
      for (const [nodes, target] of [
        [record.addedNodes, added],
        [record.removedNodes, removed],
      ] as const) {
        for (const node of nodes) {
          if (node.nodeType !== 1) continue;
          const element = node as HTMLElement;
          if (element.matches(tagSelector)) target.add(element);
          for (const tag of element.querySelectorAll<HTMLElement>(tagSelector)) target.add(tag);
        }
      }
    }
    for (const element of removed)
      if (
        observed.elements.has(element) &&
        (!observed.root.contains(element) || !element.matches(tagSelector))
      ) {
        element.setCssProps(clearedStyleProperties);
        observed.elements.delete(element);
      }
    if (observed.file)
      for (const element of added)
        if (observed.root.contains(element)) this.applyTagStyle(observed, element);
  }

  private applyTagStyle(observed: StyledRoot, element: HTMLElement): void {
    const name = element.dataset.localTag;
    if (!name || element.hasAttribute('data-local-tags-editor')) {
      this.clearTagStyle(observed, element);
      return;
    }
    let properties = observed.properties.get(name);
    if (!properties) {
      properties = styleProperties(
        resolveStyle(
          name,
          observed.definitions ?? new Map<string, TagStyle>(),
          observed.fallbackTags,
          observed.basicStyle,
        ),
      );
      observed.properties.set(name, properties);
    }
    const changed: Record<string, string> = {};
    for (const [property, value] of Object.entries(properties))
      if (element.style.getPropertyValue(property).trim() !== value) changed[property] = value;
    if (Object.keys(changed).length) element.setCssProps(changed);
    observed.elements.add(element);
  }

  private clearTagStyle(observed: StyledRoot, element: HTMLElement): void {
    const changed: Record<string, string> = {};
    for (const property of Object.keys(clearedStyleProperties))
      if (element.style.getPropertyValue(property)) changed[property] = '';
    if (Object.keys(changed).length) element.setCssProps(changed);
    observed.elements.delete(element);
  }

  private detachRoot(root: HTMLElement): void {
    const observed = this.roots.get(root);
    if (!observed) return;
    observed.observer.disconnect();
    for (const element of observed.elements) this.clearTagStyle(observed, element);
    observed.elements.clear();
    delete root.dataset.localTagScope;
    this.roots.delete(root);
  }

  private diagnostics(file: TFile): Diagnostic[] {
    const state = this.states.get(file);
    if (!state) return [];
    const diagnostics = [...state.diagnostics];
    const basic = this.basicStyle();
    for (const name of new Set([...state.names, ...state.definitions.keys()])) {
      const style = resolveStyle(name, state.definitions, state.fallbackTags, basic);
      const text = style['text-color'];
      const background = style['background-color'];
      if (
        !text ||
        !background ||
        !/^#[0-9a-f]{6}$/iu.test(text) ||
        !/^#[0-9a-f]{6}$/iu.test(background)
      )
        continue;
      const ratio = contrastRatio(text, background);
      if (ratio < 4.5)
        diagnostics.push({
          severity: 'warning',
          tag: name,
          message: `Text and background colors have low contrast (${ratio.toFixed(2)}).`,
        });
    }
    return diagnostics;
  }

  dispose(): void {
    if (!this.active) return;
    this.active = false;
    closeStylingPickers();
    this.writer.dispose();
    this.refreshEditors();
    for (const panel of [...this.panels]) this.detachPanel(panel);
    for (const root of this.roots.keys()) this.detachRoot(root);
    this.states.clear();
    this.scopes.clear();
    this.generations.clear();
    this.pending.clear();
  }
}
