import { Decoration, EditorView, ViewPlugin } from '@codemirror/view';
import { StateField } from '@codemirror/state';
import { editorInfoField } from 'obsidian';
import type { DecorationSet } from '@codemirror/view';
import { config } from '../config.ts';
import { documentField, isEditing } from './state.ts';
import type { CurrentDocumentController } from '../services/controller.ts';

const decorations = () =>
  StateField.define<DecorationSet>({
    create: (state) => build(state.field(documentField)),
    update(previous, transaction) {
      // Enabling the plugin reconfigures editors that do not have this field yet.
      const before = transaction.startState.field(documentField, false);
      const after = transaction.state.field(documentField);
      return before === after ? previous : build(after);
    },
    provide: (field) => EditorView.decorations.from(field),
  });

function build(model: ReturnType<CurrentDocumentController['modelFor']>): DecorationSet {
  if (!model) return Decoration.none;
  return Decoration.set(
    model.candidates
      .filter((candidate) => candidate.kind !== 'plain' && !isEditing(model, candidate))
      .map((candidate) =>
        Decoration.mark({
          attributes: {
            'data-local-tags-editor': 'true',
          },
          class: candidate.kind === 'error' ? config.errorClass : config.tagClass,
        }).range(candidate.from, candidate.to),
      ),
  );
}

export function editorExtension(
  controller: CurrentDocumentController,
  refreshReading?: (view: EditorView) => void,
) {
  return [
    documentField,
    decorations(),
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
          if (update.docChanged || update.viewportChanged || fileChanged) refresh();
        },
        destroy() {
          destroyed = true;
          observer?.disconnect();
          controller.views.delete(view);
          if (controller.currentView === view) controller.currentView = null;
        },
      };
    }),
  ];
}
