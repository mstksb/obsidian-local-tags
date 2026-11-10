export interface TagTooltipContent {
  scope: string;
  name: string;
  text: string;
}

const selector = '.local-tags-tag[data-local-tag],.local-tags-tree-link[data-local-tag]';
let nextId = 0;

/** Own the tooltip and its lifecycle without changing tag keyboard navigation. */
export class TagTooltips {
  private readonly window: NonNullable<Document['defaultView']>;
  private readonly id = `local-tag-tooltip-${++nextId}`;
  private readonly cleanups: Array<() => void> = [];
  private readonly document: Document;
  private readonly resolve: (target: HTMLElement) => TagTooltipContent | null;
  private target: HTMLElement | null = null;
  private dismissedPanel: HTMLElement | null = null;
  private content: TagTooltipContent | null = null;
  private tooltip: HTMLElement | null = null;
  private timer: number | null = null;
  private observer: MutationObserver | null = null;
  private disposed = false;

  constructor(document: Document, resolve: (target: HTMLElement) => TagTooltipContent | null) {
    const window = document.defaultView;
    if (!window) throw new Error('Tag tooltips require a document window');
    this.window = window;
    this.document = document;
    this.resolve = resolve;
    const listen = (
      target: EventTarget,
      type: string,
      listener: EventListener,
      capture = false,
    ): void => {
      target.addEventListener(type, listener, capture);
      this.cleanups.push(() => target.removeEventListener(type, listener, capture));
    };
    listen(document, 'mouseover', (event) => {
      this.activate(this.find(event.target), false);
    });
    listen(document, 'mouseout', (event) => {
      if (
        this.find(event.target) === this.dismissedPanel &&
        this.find((event as MouseEvent).relatedTarget) !== this.dismissedPanel
      )
        this.dismissedPanel = null;
      if (!this.target || this.find(event.target) !== this.target) return;
      this.activate(this.find((event as MouseEvent).relatedTarget), false);
    });
    const dismissPanel = (event: Event): void => {
      const target = this.find(event.target);
      if (!target?.matches('.local-tags-tree-link')) return;
      this.dismissedPanel = target;
      this.hide();
    };
    listen(document, 'pointerdown', dismissPanel, true);
    listen(document, 'click', dismissPanel, true);
    listen(document, 'focusin', (event) => {
      const target = this.find(event.target);
      if (target?.matches('.local-tags-tree-link')) this.activate(target, true);
    });
    listen(document, 'focusout', (event) => {
      if (!this.target || this.find(event.target) !== this.target) return;
      const target = this.find((event as FocusEvent).relatedTarget);
      this.activate(target?.matches('.local-tags-tree-link') ? target : null, true);
    });
    listen(
      document,
      'keydown',
      (event) => {
        const key = (event as KeyboardEvent).key;
        if (key === 'Escape') this.hide();
        if (key === 'Tab') this.dismissedPanel = null;
      },
      true,
    );
    listen(document, 'scroll', () => this.hide(), true);
    listen(window, 'blur', () => this.hide());
    listen(window, 'resize', () => this.hide());
  }

  private find(value: EventTarget | null): HTMLElement | null {
    // Resolve in the target's document realm, including pop-out windows.
    if (!(value instanceof this.window.Element)) return null;
    const target = value.closest<HTMLElement>(selector);
    return target?.isConnected && !target.matches('.local-tags-error') ? target : null;
  }

  private valid(target: HTMLElement): TagTooltipContent | null {
    if (
      !target.isConnected ||
      target.ownerDocument !== this.document ||
      !target.matches(selector) ||
      target.matches('.local-tags-error')
    )
      return null;
    const content = this.resolve(target);
    return content?.text.trim() ? content : null;
  }

  private same(content: TagTooltipContent): boolean {
    return content.scope === this.content?.scope && content.name === this.content.name;
  }

  private activate(target: HTMLElement | null, immediate: boolean): void {
    if (this.disposed) return;
    // Clicking a search link must not reopen its tooltip through focus or hover.
    // Restore normal hover after the pointer leaves the clicked link.
    if (target && target === this.dismissedPanel) {
      this.hide();
      return;
    }
    const content = target ? this.valid(target) : null;
    if (!target || !content) {
      this.hide();
      return;
    }
    if (this.same(content)) {
      if (this.target !== target) {
        this.removeDescription();
        this.target = target;
      }
      this.content = content;
      if (this.tooltip) this.render();
      else if (immediate) this.show();
      return;
    }
    this.hide();
    this.target = target;
    this.content = content;
    this.observer = new this.window.MutationObserver(() => {
      if (!this.target?.isConnected) this.hide();
    });
    this.observer.observe(this.document.documentElement, {
      childList: true,
      subtree: true,
    });
    if (immediate) this.show();
    else this.timer = this.window.setTimeout(() => this.show(), 250);
  }

  private show(): void {
    this.cancelTimer();
    if (!this.target || this.disposed) return;
    const content = this.valid(this.target);
    if (!content || !this.same(content)) {
      this.hide();
      return;
    }
    this.content = content;
    this.tooltip = this.window.createDiv();
    this.tooltip.id = this.id;
    this.tooltip.className = 'local-tags-synopsis-tooltip';
    this.tooltip.setAttribute('data-local-tag-tooltip', '');
    this.tooltip.setAttribute('role', 'tooltip');
    this.document.body.append(this.tooltip);
    this.render();
  }

  private render(): void {
    if (!this.target || !this.content || !this.tooltip) return;
    if (this.tooltip.textContent !== this.content.text)
      this.tooltip.textContent = this.content.text;
    // CodeMirror owns editor marks and removes attributes absent from their
    // decorations. Reasserting ARIA here can make its observer and our refresh
    // alternate forever. Keep this popup outside the editor and leave its marks
    // untouched; Reading tags and keyboard-accessible panel links retain ARIA.
    if (!this.target.closest('.cm-content,[data-local-tags-editor]')) {
      const tokens = new Set(
        (this.target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean),
      );
      tokens.add(this.id);
      const description = [...tokens].join(' ');
      if (this.target.getAttribute('aria-describedby') !== description)
        this.target.setAttribute('aria-describedby', description);
    }
    const width = this.window.innerWidth;
    const height = this.window.innerHeight;
    const marginX = Math.min(8, width / 2);
    const marginY = Math.min(8, height / 2);
    this.setStyle('max-width', `${Math.min(360, width - 2 * marginX)}px`);
    this.setStyle('max-height', `${height - 2 * marginY}px`);
    const anchor = this.target.getBoundingClientRect();
    const rect = this.tooltip.getBoundingClientRect();
    const left = Math.max(marginX, Math.min(anchor.left, width - rect.width - marginX));
    const preferred =
      anchor.bottom + 6 + rect.height <= height - marginY
        ? anchor.bottom + 6
        : anchor.top - rect.height - 6;
    const top = Math.max(marginY, Math.min(preferred, height - rect.height - marginY));
    this.setStyle('left', `${left}px`);
    this.setStyle('top', `${top}px`);
  }

  private setStyle(property: 'max-width' | 'max-height' | 'left' | 'top', value: string): void {
    if (this.tooltip && this.tooltip.style.getPropertyValue(property) !== value)
      this.tooltip.setCssProps({ [property]: value });
  }

  /** Revalidate the active tag after definitions or file scopes change. */
  refresh(): void {
    if (this.disposed || !this.target) return;
    const content = this.valid(this.target);
    if (!content || !this.same(content)) {
      this.hide();
      return;
    }
    this.content = content;
    this.render();
  }

  private removeDescription(): void {
    if (!this.target) return;
    const existing = this.target.getAttribute('aria-describedby') ?? '';
    if (!existing.split(/\s+/).includes(this.id)) return;
    const tokens = existing.split(/\s+/).filter((token) => token && token !== this.id);
    if (tokens.length) this.target.setAttribute('aria-describedby', tokens.join(' '));
    else this.target.removeAttribute('aria-describedby');
  }

  private cancelTimer(): void {
    if (this.timer !== null) this.window.clearTimeout(this.timer);
    this.timer = null;
  }

  hide(): void {
    this.cancelTimer();
    this.observer?.disconnect();
    this.observer = null;
    this.removeDescription();
    this.tooltip?.remove();
    this.tooltip = null;
    this.target = null;
    this.content = null;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.hide();
    this.dismissedPanel = null;
    for (const cleanup of this.cleanups.splice(0)) cleanup();
  }
}
