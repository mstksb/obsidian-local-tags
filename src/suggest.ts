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
import type { CompletionMatchMode } from './domain/index.ts';
import type { CurrentDocumentController } from './services/controller.ts';
import type { StylingFeature } from './styling/runtime.ts';

export class PrivateTagSuggest extends EditorSuggest<string> {
  constructor(
    private readonly controller: CurrentDocumentController,
    private readonly completionMatchMode: () => CompletionMatchMode = () => 'substring',
    private readonly completionCaseSensitive: () => boolean = () => false,
    private readonly styling?: Pick<StylingFeature, 'synopsis'>,
  ) {
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
    return this.controller.index.suggest(
      context.query,
      config.suggestionsLimit,
      this.completionMatchMode(),
      this.completionCaseSensitive(),
    );
  }

  renderSuggestion(name: string, element: HTMLElement): void {
    const file = this.context?.file;
    const synopsis =
      file && file.path === this.controller.index.path
        ? this.styling?.synopsis(file, name)
        : undefined;
    element.classList.toggle('local-tags-suggestion', Boolean(synopsis));
    element.textContent = `##${name}`;
    if (!synopsis) return;
    const label = element.createSpan();
    label.className = 'local-tags-suggestion-name';
    label.textContent = `##${name}`;
    const description = element.createSpan();
    description.className = 'local-tags-suggestion-synopsis';
    description.textContent = synopsis;
    element.replaceChildren(label, description);
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
