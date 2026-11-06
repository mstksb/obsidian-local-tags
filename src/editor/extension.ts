import { Decoration, EditorView, ViewPlugin } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import type { EditorState } from '@codemirror/state';
import { editorInfoField, editorLivePreviewField } from 'obsidian';
import type { DecorationSet } from '@codemirror/view';
import { config } from '../config.ts';
import { documentField, isEditing, selectionTouchesTag } from './state.ts';
import { navigationHighlight } from './navigation-highlight.ts';
import type { CurrentDocumentController } from '../services/controller.ts';

export const refreshTagDisplay = StateEffect.define<null>();

const decorations = (hidePrefix = () => false) =>
  StateField.define<DecorationSet>({
    create: (state) => build(state, hidePrefix()),
    update(previous, transaction) {
      // Enabling the plugin reconfigures editors that do not have this field yet.
      const before = transaction.startState.field(documentField, false);
      const after = transaction.state.field(documentField);
      const sameMode =
        transaction.startState.field(editorLivePreviewField, false) ===
        transaction.state.field(editorLivePreviewField, false);
      const sameHighlight =
        transaction.startState.field(navigationHighlight, false) ===
        transaction.state.field(navigationHighlight, false);
      return before === after &&
        sameMode &&
        sameHighlight &&
        !transaction.selection &&
        !transaction.effects.some((effect) => effect.is(refreshTagDisplay))
        ? previous
        : build(transaction.state, hidePrefix());
    },
    provide: (field) => EditorView.decorations.from(field),
  });

function build(state: EditorState, hidePrefix = false): DecorationSet {
  const model = state.field(documentField);
  if (!model) return Decoration.none;
  const highlight = state.field(navigationHighlight, false);
  return Decoration.set(
    model.candidates
      .filter((candidate) => candidate.kind !== 'plain' && !isEditing(model, candidate))
      .flatMap((candidate) => {
        const match =
          candidate.kind === 'valid' &&
          highlight?.from === candidate.from &&
          highlight.to === candidate.to
            ? highlight
            : null;
        const tagClass = candidate.kind === 'error' ? config.errorClass : config.tagClass;
        const mark = Decoration.mark({
          attributes: {
            'data-local-tags-editor': 'true',
            ...(match && {
              'data-local-tags-match-path': match.path,
              'data-local-tags-match-from': String(match.from),
              'data-local-tags-match-to': String(match.to),
            }),
          },
          class: match ? `${tagClass} local-tags-current-match` : tagClass,
        }).range(candidate.from, candidate.to);
        return hidePrefix &&
          state.field(editorLivePreviewField, false) &&
          candidate.kind === 'valid' &&
          !selectionTouchesTag(state.selection, candidate)
          ? [mark, Decoration.replace({}).range(candidate.from, candidate.from + 2)]
          : [mark];
      }),
    true,
  );
}

export function editorExtension(
  controller: CurrentDocumentController,
  refreshReading?: (view: EditorView) => void,
  hidePrefix = () => false,
) {
  return [
    documentField,
    decorations(hidePrefix),
    ViewPlugin.define((view) => {
      controller.views.add(view);
      controller.observe(view);
      let file = view.state.field(editorInfoField, false)?.file;
      let path = file?.path;
      // Obsidian can reuse rendered widgets without calling postprocessors again.
      // Observe widget attachment; disconnect while applying our own DOM changes.
      let scheduled = false;
      let destroyed = false;
      const refresh = () => {
        if (!refreshReading || scheduled || destroyed) return;
        scheduled = true;
        queueMicrotask(() => {
          scheduled = false;
          if (destroyed || !controller.views.has(view)) return;
          observer?.disconnect();
          try {
            refreshReading(view);
          } finally {
            if (!destroyed)
              observer?.observe(view.contentDOM, {
                childList: true,
                subtree: true,
              });
          }
        });
      };
      const observer = refreshReading ? new MutationObserver(refresh) : null;
      refresh();
      return {
        update(update) {
          const nextFile = update.state.field(editorInfoField, false)?.file;
          const fileChanged = file !== nextFile || path !== nextFile?.path;
          // Snapshot primitives too: Obsidian may mutate the same info/TFile object.
          file = nextFile;
          path = nextFile?.path;
          if (update.docChanged || update.selectionSet || update.focusChanged || fileChanged)
            controller.observe(update.view);
          if (
            update.docChanged ||
            update.viewportChanged ||
            (update.selectionSet && hidePrefix()) ||
            fileChanged ||
            update.transactions.some((transaction) =>
              transaction.effects.some((effect) => effect.is(refreshTagDisplay)),
            ) ||
            update.startState.field(editorLivePreviewField, false) !==
              update.state.field(editorLivePreviewField, false)
          )
            refresh();
        },
        destroy() {
          destroyed = true;
          observer?.disconnect();
          controller.views.delete(view);
          if (controller.currentView === view) controller.currentView = null;
        },
      };
    }),
    navigationHighlight,
  ];
}
