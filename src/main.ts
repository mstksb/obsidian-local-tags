import { MarkdownView, Notice, Plugin, TFile, editorInfoField } from 'obsidian';
import type { EditorView } from '@codemirror/view';
import { config } from './config.ts';
import { editorExtension } from './editor/extension.ts';
import { editorReadingSection } from './editor/reading.ts';
import { CurrentDocumentController } from './services/controller.ts';
import { PrivateTagSuggest } from './suggest.ts';
import { PrivateTagView } from './views.ts';
import { clearReading, decorateReading } from './reading.ts';
import { ReadingSourceCache } from './reading-source.ts';
import { LocalTagsSettingTab, normalizeSettings } from './settings.ts';
import type { LocalTagsSettings } from './settings.ts';
import { registerLocalTagsIcon } from './icons.ts';

export default class LocalTagsPlugin extends Plugin {
  settings = normalizeSettings(null);
  private appearanceRoot?: HTMLElement;
  private settingsVersion = 0;
  private settingsLoad: Promise<void> = Promise.resolve();
  private settingsOverrides: Partial<LocalTagsSettings> = {};
  private settingsSave: Promise<void> = Promise.resolve();
  private controller!: CurrentDocumentController;
  private readonly readingElements = new Map<HTMLElement, () => boolean>();
  private readonly readingRequests = new WeakMap<HTMLElement, object>();
  private readingSources!: ReadingSourceCache;
  private alive = false;

  onload(): void {
    this.alive = true;
    registerLocalTagsIcon();
    this.readingSources = new ReadingSourceCache((file) => this.app.vault.cachedRead(file));
    this.controller = new CurrentDocumentController(this.app);
    this.registerView(config.treeViewType, (leaf) => new PrivateTagView(leaf, this.controller));
    this.registerEditorExtension(
      editorExtension(this.controller, (view) => this.refreshEditorReading(view)),
    );
    this.addSettingTab(new LocalTagsSettingTab(this.app, this));
    const settingsVersion = ++this.settingsVersion;
    this.settingsOverrides = {};
    this.settingsLoad = this.loadData().then((value: unknown) => {
      if (!this.alive || this.settingsVersion !== settingsVersion) return;
      this.settings = normalizeSettings({
        ...normalizeSettings(value),
        ...this.settingsOverrides,
      });
      this.applyAppearance();
    });
    this.run(this.settingsLoad);
    this.registerEditorSuggest(new PrivateTagSuggest(this.controller));
    this.addCommand({
      id: 'open-tag-panel',
      name: 'Open tag panel',
      callback: () => this.openView(config.treeViewType),
    });
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        const view = this.markdownTarget();
        this.run(this.controller.activate(file, view?.file === file ? view.editor : undefined));
      }),
    );
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) =>
        this.run(this.controller.followLeaf(leaf)),
      ),
    );
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile) {
          this.readingSources.invalidate(file);
        }
      }),
    );
    this.registerEvent(
      this.app.vault.on('rename', (file) => {
        if (file instanceof TFile) this.readingSources.invalidate(file);
        if (this.controller.file === file) {
          this.controller.refresh();
        }
      }),
    );
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile) this.readingSources.invalidate(file);
        if (this.controller.file === file) {
          this.run(this.controller.activate(null));
        }
      }),
    );
    this.registerMarkdownPostProcessor((element, context) => {
      if (!this.alive) return;
      const request = {};
      this.readingRequests.set(element, request);
      const initialInfo = context.getSectionInfo(element);
      const initialRange = initialInfo
        ? { lineStart: initialInfo.lineStart, lineEnd: initialInfo.lineEnd }
        : null;
      const file = this.app.vault.getFileByPath(context.sourcePath);
      if (!file) return;
      this.run(
        this.readingSources.read(file).then((document) => {
          // Live Preview renders callouts and individual table cells without section info.
          // Wait until the widget is attached, then resolve against the current editor buffer.
          const editorSection = !initialRange
            ? editorReadingSection(element, this.controller.views, context.sourcePath)
            : null;
          if (
            !this.alive ||
            this.readingRequests.get(element) !== request ||
            !(editorSection?.isCurrent() ?? document?.isCurrent()) ||
            context.sourcePath !== file.path
          )
            return;
          if (editorSection) {
            decorateReading(element, editorSection.source, editorSection.allowed);
            this.trackReading(element);
            return;
          }
          // Reading owns offscreen sections while they are disconnected from
          // the DOM. Its section lookup also rejects sections it has discarded.
          const info = context.getSectionInfo(element);
          if (
            !info ||
            (initialRange &&
              (info.lineStart !== initialRange.lineStart || info.lineEnd !== initialRange.lineEnd))
          )
            return;
          const section = document?.section(info.lineStart, info.lineEnd);
          if (!section || !document) return;
          decorateReading(element, section.source, section.allowed);
          this.trackReading(element, () => {
            const current = context.getSectionInfo(element);
            return (
              document.isCurrent() &&
              this.readingRequests.get(element) === request &&
              context.sourcePath === file.path &&
              current?.lineStart === info.lineStart &&
              current.lineEnd === info.lineEnd
            );
          });
        }),
      );
    });
    this.app.workspace.onLayoutReady(() => {
      if (!this.alive) return;
      const view = this.markdownTarget();
      this.run(
        this.controller.activate(view?.file ?? this.app.workspace.getActiveFile(), view?.editor),
      );
    });
  }

  private markdownTarget(): MarkdownView | null {
    const active = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (active) return active;
    const recent = this.app.workspace.getMostRecentLeaf?.();
    return recent?.view instanceof MarkdownView ? recent.view : null;
  }

  async setTagVerticalPadding(value: number): Promise<void> {
    await this.updateSettings({ tagVerticalPadding: value });
  }

  async updateSettings(value: Partial<LocalTagsSettings>): Promise<void> {
    this.settingsOverrides = { ...this.settingsOverrides, ...value };
    this.settings = normalizeSettings({ ...this.settings, ...value });
    this.applyAppearance();
    const loaded = this.settingsLoad;
    // Color and slider events can overlap; keep disk writes in the same order.
    this.settingsSave = this.settingsSave
      .catch(() => {})
      .then(async () => {
        await loaded;
        await this.saveData(this.settings);
      });
    await this.settingsSave;
  }

  private applyAppearance(): void {
    if (!this.alive) return;
    const root = this.app.workspace.containerEl?.ownerDocument.body;
    if (root !== this.appearanceRoot) this.clearAppearance();
    if (!root) return;
    this.appearanceRoot = root;
    const settings = this.settings;
    root.setCssProps({
      '--local-tags-padding-y-offset': `${settings.tagVerticalPadding}px`,
      '--local-tags-color': settings.tagTextColor,
      '--local-tags-background': settings.tagBackgroundColor,
      '--local-tags-weight':
        settings.tagBold === 'default' ? '' : settings.tagBold === 'on' ? '700' : '400',
      '--local-tags-decoration':
        settings.tagUnderline === 'default'
          ? ''
          : settings.tagUnderline === 'on'
            ? 'underline'
            : 'none',
      '--local-tags-style':
        settings.tagItalic === 'default' ? '' : settings.tagItalic === 'on' ? 'italic' : 'normal',
    });
  }

  private clearAppearance(): void {
    this.appearanceRoot?.setCssProps({
      '--local-tags-padding-y-offset': '',
      '--local-tags-color': '',
      '--local-tags-background': '',
      '--local-tags-weight': '',
      '--local-tags-decoration': '',
      '--local-tags-style': '',
    });
    this.appearanceRoot = undefined;
  }

  private refreshEditorReading(view: EditorView): void {
    if (!this.alive) return;
    const path = view.state.field(editorInfoField, false)?.file?.path;
    if (!path) return;
    for (const element of view.contentDOM.querySelectorAll<HTMLElement>(
      '[data-callout],table th,table td',
    )) {
      if (
        element.parentElement?.closest('[data-callout]') ||
        element.querySelector('[contenteditable="true"]')
      )
        continue;
      const section = editorReadingSection(element, [view], path);
      if (!section?.isCurrent()) continue;
      decorateReading(element, section.source, section.allowed);
      this.trackReading(element);
    }
  }

  private trackReading(element: HTMLElement, owned = () => element.isConnected): void {
    this.readingElements.set(element, owned);
    // Bound ownership references when sections are re-rendered.
    for (const [old, isOwned] of this.readingElements)
      if (!isOwned()) {
        clearReading(old);
        this.readingElements.delete(old);
      }
  }

  private openView(type: string): void {
    const leaf =
      this.app.workspace.getLeavesOfType(type)[0] ?? this.app.workspace.getRightLeaf(false);
    if (!leaf) return;
    this.run(
      leaf.setViewState({ type, active: false }).then(() => this.app.workspace.revealLeaf(leaf)),
    );
  }

  private run(work: Promise<unknown>): void {
    void work.catch((error: unknown) => {
      if (!this.alive) return;
      new Notice(`Local Tags: ${String(error)}`);
    });
  }

  onunload(): void {
    this.alive = false;
    this.settingsVersion++;
    this.clearAppearance();
    this.readingSources.dispose();
    this.controller.dispose();
    for (const element of this.readingElements.keys()) clearReading(element);
    this.readingElements.clear();
  }
}
