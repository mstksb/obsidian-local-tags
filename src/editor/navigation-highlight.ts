import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import { editorInfoField, editorLivePreviewField } from 'obsidian';

export interface NavigationHighlight {
  path: string;
  from: number;
  to: number;
}

export const setNavigationHighlight = StateEffect.define<NavigationHighlight | null>();

export const navigationHighlight = StateField.define<NavigationHighlight | null>({
  create: () => null,
  update(previous, transaction) {
    if (
      transaction.docChanged ||
      transaction.startState.field(editorLivePreviewField, false) !==
        transaction.state.field(editorLivePreviewField, false)
    )
      return null;

    let highlight = previous;
    for (const effect of transaction.effects)
      if (effect.is(setNavigationHighlight)) highlight = effect.value;

    if (
      highlight &&
      (highlight.path !== transaction.state.field(editorInfoField, false)?.file?.path ||
        highlight.from < 0 ||
        highlight.to <= highlight.from ||
        highlight.to > transaction.state.doc.length)
    )
      return null;

    return highlight;
  },
  provide: (field) =>
    EditorView.decorations.compute([field], (state) => {
      const highlight = state.field(field);
      if (!highlight) return Decoration.none;
      return Decoration.set(
        [
          Decoration.line({ class: 'local-tags-current-line' }).range(
            state.doc.lineAt(highlight.from).from,
          ),
        ],
        true,
      );
    }),
});
