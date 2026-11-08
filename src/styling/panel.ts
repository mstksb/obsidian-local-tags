import type { Diagnostic } from './types.ts';

export const panelActions = {
  ensure: 'Add missing settings',
  'remove-empty': 'Remove empty settings',
  'random-tag': 'Random decoration',
  sort: 'Sort settings',
  'fold-tags': 'Expand to tag headings',
} as const;
export type PanelAction = keyof typeof panelActions;

interface PanelCallbacks {
  onAction(action: PanelAction): void;
}

interface PanelState {
  scope?: string;
  verticalPadding: number;
  busy: boolean;
  canFold: boolean;
  caretTarget: string | null;
  diagnostics: readonly Diagnostic[];
}

/** Owns panel DOM and transient presentation state without document access. */
export class StylingPanel {
  private readonly controls: HTMLDetailsElement;
  private readonly errorCount: HTMLElement;
  private errorIdentities = new Set<string>();
  private readonly target: HTMLElement;
  private readonly messages: HTMLTextAreaElement;

  constructor(
    readonly root: HTMLElement,
    callbacks: PanelCallbacks,
  ) {
    const document = root.ownerDocument;
    const ownerWindow = document.defaultView;
    if (!ownerWindow) throw new Error('Tag controls require a document window.');
    const controls = ownerWindow.createEl('details');
    controls.className = 'local-tags-controls';
    controls.dataset.localTagControls = 'true';
    controls.open = true;
    const summary = ownerWindow.createEl('summary');
    const errorCount = ownerWindow.createSpan();
    errorCount.dataset.localTagErrorCount = 'true';
    errorCount.setAttribute('aria-live', 'polite');
    summary.append('Settings, actions and messages', errorCount);
    const body = ownerWindow.createDiv();
    body.className = 'local-tags-control-body';
    body.dataset.localTagControlBody = 'true';
    const target = ownerWindow.createDiv();
    target.dataset.localTagCaretTarget = 'true';
    target.setAttribute('aria-live', 'polite');
    const buttons = ownerWindow.createDiv();
    buttons.className = 'local-tags-control-actions';
    for (const [action, label] of Object.entries(panelActions)) {
      const button = ownerWindow.createEl('button');
      button.textContent = label;
      button.dataset.localTagAction = action;
      button.type = 'button';
      button.onclick = () => callbacks.onAction(action as PanelAction);
      buttons.append(button);
    }
    const messages = ownerWindow.createEl('textarea');
    messages.className = 'local-tags-control-messages';
    messages.readOnly = true;
    messages.rows = 3;
    messages.setAttribute('aria-label', 'Local tag decoration messages');
    messages.dataset.localTagMessages = 'true';
    body.append(target, buttons, messages);
    controls.append(summary, body);
    root.insertBefore(controls, root.querySelector('.view-content'));
    this.controls = controls;
    this.errorCount = errorCount;
    this.target = target;
    this.messages = messages;
  }

  get caretTarget(): string | null {
    return this.target.textContent;
  }

  render(state: PanelState): void {
    this.root.setCssProps({ '--local-tags-padding-y-offset': `${state.verticalPadding}px` });
    if (state.scope) this.root.dataset.localTagScope = state.scope;
    else delete this.root.dataset.localTagScope;
    for (const button of this.controls.querySelectorAll('button')) {
      const folding = button.dataset.localTagAction === 'fold-tags';
      button.disabled = !state.scope || state.busy || (folding && !state.canFold);
      button.title = folding && !state.canFold ? 'Folding is available in editing mode.' : '';
    }
    const targetLabel = `Target: ${state.caretTarget ?? 'All tags'}`;
    if (this.target.textContent !== targetLabel) this.target.textContent = targetLabel;
    const errors = state.diagnostics.filter((item) => item.severity === 'error');
    const identities = new Set(
      state.scope ? errors.map((error) => `${state.scope}:${JSON.stringify(error)}`) : [],
    );
    if ([...identities].some((identity) => !this.errorIdentities.has(identity)))
      this.controls.open = true;
    this.errorIdentities = identities;
    this.errorCount.textContent = `Errors: ${errors.length}`;
    this.messages.value = state.scope
      ? [
          this.formatMessages(state.diagnostics),
          state.canFold ? '' : 'Folding is available in editing mode.',
        ]
          .filter(Boolean)
          .join('\n')
      : 'Open a Markdown file.';
  }

  private formatMessages(diagnostics: readonly Diagnostic[]): string {
    return diagnostics
      .map((item) =>
        [
          item.severity === 'warning' ? 'Warning' : item.severity === 'error' ? 'Error' : 'Info',
          item.line ? `Line ${item.line}` : '',
          item.tag ? `##${item.tag}` : '',
          item.message,
        ]
          .filter(Boolean)
          .join(': '),
      )
      .join('\n');
  }

  dispose(): void {
    this.controls.remove();
    delete this.root.dataset.localTagScope;
    this.root.style.removeProperty('--local-tags-padding-y-offset');
  }
}
