import { editorInfoField } from 'obsidian';
import type { EditorView } from '@codemirror/view';
import { ReadingDocument } from '../reading-source.ts';
import type { Candidate } from '../domain/parser.ts';
import { documentField, isEditing } from './state.ts';
import type { DocumentModel } from './state.ts';

const documents = new WeakMap<DocumentModel, ReadingDocument>();

export function editorReadingSection(
  element: HTMLElement,
  views: Iterable<EditorView>,
  sourcePath: string,
): { source: string; allowed: Candidate[]; isCurrent: () => boolean } | null {
  for (const view of views) {
    if (
      !view.contentDOM.contains(element) ||
      view.state.field(editorInfoField, false)?.file?.path !== sourcePath
    )
      continue;
    const model = view.state.field(documentField, false);
    if (!model) return null;
    let document = documents.get(model);
    if (!document) {
      const source = view.state.doc;
      document = new ReadingDocument(
        source.toString(),
        () => view.state.doc === source,
        () => model.candidates.filter((tag) => !isEditing(model, tag)),
      );
      documents.set(model, document);
    }
    const cell = element.closest('td,th');
    const row = cell?.parentElement;
    const table = cell?.closest('table');
    const coordinates =
      cell && row && table
        ? {
            row: [...table.rows].indexOf(row as HTMLTableRowElement),
            column: [...row.children].indexOf(cell),
          }
        : undefined;
    const offset = view.posAtDOM(element);
    const section = document.widget(offset, coordinates);
    if (!section) return null;
    return {
      ...section,
      isCurrent: () =>
        document.isCurrent() &&
        view.contentDOM.contains(element) &&
        view.state.field(editorInfoField, false)?.file?.path === sourcePath &&
        view.posAtDOM(element) === offset,
    };
  }
  return null;
}
