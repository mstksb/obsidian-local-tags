import { EditorSuggest } from 'obsidian';
import type {
  Editor,
  EditorPosition,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from 'obsidian';
import { candidateAt } from './domain/parser.ts';
import { config } from './config.ts';
import type { CurrentDocumentController } from './services/controller.ts';

export class PrivateTagSuggest extends EditorSuggest<string> {
  constructor(private readonly controller: CurrentDocumentController) {
    super(controller.app);
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile | null,
  ): EditorSuggestTriggerInfo | null {
    if (!file || file.path !== this.controller.index.path) return null;
    const model = this.controller.modelFor(editor, file);
    if (!model) return null;
    const offset = editor.posToOffset(cursor);
    const candidate = candidateAt(model.candidates, offset);
    if (
      !candidate ||
      !model.pending.some((item) => candidate.from < item.to && item.from < candidate.to)
    )
      return null;
    return {
      start: editor.offsetToPos(candidate.from),
      end: editor.offsetToPos(candidate.to),
      query: candidate.name,
    };
  }

  getSuggestions(context: EditorSuggestContext): string[] {
    return this.controller.index.suggest(context.query, config.suggestionsLimit);
  }

  renderSuggestion(name: string, element: HTMLElement): void {
    element.textContent = `##${name}`;
  }

  selectSuggestion(name: string, event: MouseEvent | KeyboardEvent): void {
    if (!('key' in event) || event.key !== 'Enter' || !this.context) return;
    const { editor, start, end, file } = this.context;
    if (file.path !== this.controller.index.path) {
      this.close();
      return;
    }
    const replacement = `##${name} `;
    editor.replaceRange(replacement, start, end);
    editor.setCursor({ line: start.line, ch: start.ch + replacement.length });
    this.controller.commitCurrent();
    this.close();
  }
}
