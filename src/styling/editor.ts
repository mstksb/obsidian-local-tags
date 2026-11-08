import {
  codeFolding,
  foldEffect,
  foldedRanges,
  foldState,
  unfoldEffect,
} from '@codemirror/language';
import { EditorSelection, StateEffect, Transaction } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, WidgetType } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { editorInfoField } from 'obsidian';
import type { TFile } from 'obsidian';
import { settingsLayout } from './document.ts';
import { createColorPicker } from './color-picker.ts';
import type { ColorKey, Operation, SettingsLayout, SourceRange } from './types.ts';

type ApplyColor = (file: TFile, operation: Operation, view: EditorView) => Promise<unknown>;
type ReportError = (file: TFile, error: unknown) => void;
type ColorTarget = SourceRange & {
  tag: string;
  key: ColorKey;
  value: string;
};

const pickers = new Map<EditorView, () => void>();
const settingsSnapshots = new WeakMap<
  EditorView,
  { doc: EditorView['state']['doc']; source: string; layout: SettingsLayout | null }
>();

/** Share one settings parse between the editor widgets and tag panel for each document version. */
export function settingsSnapshot(view: EditorView) {
  let snapshot = settingsSnapshots.get(view);
  if (!snapshot || snapshot.doc !== view.state.doc) {
    const source = view.state.doc.toString();
    snapshot = { doc: view.state.doc, source, layout: settingsLayout(source) };
    settingsSnapshots.set(view, snapshot);
  }
  return snapshot;
}

/** Close transient controls when the active file, feature or pane changes. */
export function closeStylingPickers(view?: EditorView): void {
  if (view) pickers.get(view)?.();
  else for (const close of [...pickers.values()]) close();
}

class ColorSwatch extends WidgetType {
  constructor(
    private readonly target: ColorTarget,
    private readonly open: (target: ColorTarget, anchor: HTMLElement) => void,
  ) {
    super();
  }

  eq(other: ColorSwatch): boolean {
    return (
      this.target.tag === other.target.tag &&
      this.target.key === other.target.key &&
      this.target.value === other.target.value &&
      this.target.from === other.target.from &&
      this.target.to === other.target.to &&
      this.open === other.open
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const ownerWindow = view.dom.ownerDocument.defaultView;
    if (!ownerWindow) throw new Error('Color swatches require a document window.');
    const button = ownerWindow.createEl('button');
    button.type = 'button';
    button.className = 'local-tags-color-swatch';
    button.dataset.localTagColor = this.target.value;
    button.dataset.localTagColorKey = this.target.key;
    button.dataset.localTagColorTag = this.target.tag;
    button.setCssProps({ '--local-tags-swatch-color': this.target.value });
    const label = `Change ##${this.target.tag} ${this.target.key} (${this.target.value})`;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.addEventListener('mousedown', (event) => event.preventDefault());
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.open(this.target, button);
    });
    return button;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

export function stylingEditorExtension(
  onApply: ApplyColor,
  onError: ReportError,
  isActive: () => boolean = () => true,
): Extension {
  return [
    ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        private file: TFile | null;
        private destroyed = false;

        constructor(private readonly view: EditorView) {
          this.file = view.state.field(editorInfoField, false)?.file ?? null;
          this.decorations = this.build();
        }

        private build(): DecorationSet {
          if (!isActive() || !this.file) return Decoration.none;
          const { layout } = settingsSnapshot(this.view);
          return Decoration.set(
            (layout?.tags ?? []).flatMap((tag) =>
              tag.colors.map((color) =>
                Decoration.widget({
                  widget: new ColorSwatch({ ...color, tag: tag.name }, (target, anchor) =>
                    this.open(target, anchor),
                  ),
                  side: 1,
                }).range(color.to),
              ),
            ),
            true,
          );
        }

        update(update: ViewUpdate): void {
          const file = update.state.field(editorInfoField, false)?.file ?? null;
          const changed =
            update.docChanged ||
            file !== this.file ||
            update.transactions.some((transaction) => transaction.reconfigured);
          if (changed || !isActive()) closeStylingPickers(this.view);
          this.file = file;
          if (changed || !isActive()) this.decorations = this.build();
        }

        destroy(): void {
          this.destroyed = true;
          closeStylingPickers(this.view);
        }

        private open(target: ColorTarget, anchor: HTMLElement): void {
          const view = this.view;
          const file = this.file;
          if (!file || !isActive() || this.destroyed || !view.dom.isConnected) return;
          closeStylingPickers();
          const expectedSource = view.state.doc.toString();
          const owner = view.dom.ownerDocument;
          let closed = false;
          const picker = createColorPicker(
            owner,
            target.value,
            (value) => {
              if (closed) return;
              if (
                !isActive() ||
                this.destroyed ||
                !view.dom.isConnected ||
                view.state.field(editorInfoField, false)?.file !== file ||
                view.state.doc.toString() !== expectedSource
              ) {
                close();
                onError(
                  file,
                  new Error('The editing target changed. The color update was canceled.'),
                );
                return;
              }
              close();
              void onApply(
                file,
                {
                  kind: 'color',
                  tag: target.tag,
                  key: target.key,
                  value,
                  expectedSource,
                },
                view,
              ).catch((error: unknown) => onError(file, error));
            },
            () => {
              if (closed) return;
              close();
              view.focus();
            },
            { title: `##${target.tag} / ${target.key}` },
          );
          picker.setAttribute('aria-label', `##${target.tag} ${target.key}`);
          const close = () => {
            if (closed) return;
            closed = true;
            picker.remove();
            if (pickers.get(view) === close) pickers.delete(view);
          };
          pickers.set(view, close);
          // Isolate native form controls from the surrounding CodeMirror editor.
          picker.addEventListener('keydown', (event) => event.stopPropagation());
          picker.addEventListener('mousedown', (event) => event.stopPropagation());
          const position = anchor.getBoundingClientRect();
          const container = view.dom.getBoundingClientRect();
          picker.setCssProps({
            '--local-tags-picker-left': `${Math.max(0, Math.min(position.left - container.left, container.width - 304))}px`,
            '--local-tags-picker-top': `${Math.max(0, Math.min(position.bottom - container.top + 4, container.height - 360))}px`,
          });
          view.dom.append(picker);
          queueMicrotask(() => {
            if (!closed) picker.querySelector<HTMLInputElement>('[data-picker-hex]')?.focus();
          });
        }
      },
      { decorations: (plugin) => plugin.decorations },
    ),
  ];
}

/** Change only settings folds. No document changes or undo entries are added. */
export function foldSettings(view: EditorView, mode: 'heading' | 'tags'): void {
  const state = view.state;
  const { layout } = settingsSnapshot(view);
  if (!layout)
    throw new Error(
      'The configuration section is missing or contains duplicate headings, lists, or tags',
    );
  const { section, tags } = layout;
  const inside: SourceRange[] = [];
  const outside: SourceRange[] = [];
  let crossing = false;
  foldedRanges(state).between(0, state.doc.length, (from, to) => {
    if (from >= section.from && to <= section.to) inside.push({ from, to });
    else if (from < section.to && to > section.from) crossing = true;
    else outside.push({ from, to });
  });
  if (crossing) throw new Error('Expand the fold enclosing the configuration section first');
  const endAtLine = (to: number) => {
    const before = state.doc.lineAt(Math.max(section.from, to - 1));
    return before.to;
  };
  const ranges = (mode === 'heading' ? [section.heading] : tags)
    .map((range) => ({
      from: state.doc.lineAt(range.from).to,
      to: endAtLine(mode === 'heading' ? section.to : range.to),
    }))
    .filter((range) => range.from < range.to);
  const effects: StateEffect<unknown>[] = inside.map((range) => unfoldEffect.of(range));
  effects.push(...ranges.map((range) => foldEffect.of(range)));
  if (!state.field(foldState, false)) effects.push(StateEffect.appendConfig.of(codeFolding()));
  const visible = (position: number) =>
    ranges.find((range) => position > range.from && position <= range.to)?.from ?? position;
  const selection = EditorSelection.create(
    state.selection.ranges.map((range) =>
      EditorSelection.range(visible(range.anchor), visible(range.head)),
    ),
    state.selection.mainIndex,
  );
  if (
    !selection.eq(state.selection) &&
    outside.some((range) => selection.main.head > range.from && selection.main.head < range.to)
  )
    throw new Error('Move the primary cursor outside the unrelated fold first');
  view.dispatch({
    effects,
    ...(selection.eq(state.selection) ? {} : { selection }),
    annotations: Transaction.addToHistory.of(false),
  });
}
