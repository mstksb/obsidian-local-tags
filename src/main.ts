import { FileView, MarkdownView, Notice, Plugin, TFile } from 'obsidian';
import { config } from './config.ts';
import { editorExtension, refreshTagDisplay } from './editor/extension.ts';
import { CurrentDocumentController } from './services/controller.ts';
import { TagNavigation } from './services/navigation.ts';
import { PrivateTagSuggest } from './suggest.ts';
import { PrivateTagView } from './views.ts';
import { ReadingRenderer } from './reading-renderer.ts';
import { LocalTagsSettingTab, normalizeSettings } from './settings.ts';
import type { LocalTagsSettings } from './settings.ts';
import { registerLocalTagsIcon } from './icons.ts';
import { StylingFeature } from './styling/runtime.ts';

export default class LocalTagsPlugin extends Plugin {
  settings = normalizeSettings(null);
  private appearanceRoot?: HTMLElement;
  private settingsVersion = 0;
  private settingsLoad: Promise<void> = Promise.resolve();
  private settingsOverrides: Partial<LocalTagsSettings> = {};
  private settingsSave: Promise<void> = Promise.resolve();
  private controller!: CurrentDocumentController;
  private navigation!: TagNavigation;
  private styling!: StylingFeature;
  private readingRenderer!: ReadingRenderer;
  private alive = false;

  onload(): void {
    this.alive = true;
    registerLocalTagsIcon();
    this.readingRenderer = new ReadingRenderer(this.app, {
      isActive: () => this.alive,
      views: () => this.controller.views,
      synchronizeReading: (file, document) => this.styling.synchronizeReading(file, document),
      run: (work) => this.run(work),
    });
    this.controller = new CurrentDocumentController(this.app);
    this.navigation = new TagNavigation(this.app, this.controller);
    this.styling = new StylingFeature(this.app, this, () => this.settings);
    this.registerView(
      config.treeViewType,
      (leaf) =>
        new PrivateTagView(
          leaf,
          this.controller,
          (tag, path) => this.run(this.navigation.navigate(tag, path)),
          this.styling,
        ),
    );
    this.registerEditorExtension(
      editorExtension(
        this.controller,
        (view) => this.readingRenderer.refreshEditor(view),
        () => this.settings.hideTagPrefix,
      ),
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
    this.registerEditorSuggest(
      new PrivateTagSuggest(
        this.controller,
        () => this.settings.completionMatchMode,
        () => this.settings.completionCaseSensitive,
        this.styling,
      ),
    );
    this.addCommand({
      id: 'open-tag-panel',
      name: 'Open tag panel',
      callback: () => this.openView(config.treeViewType),
    });
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        const view = this.markdownTarget();
        this.navigation.track(view?.file === file ? view : null);
        this.run(this.controller.activate(file, view?.file === file ? view.editor : undefined));
      }),
    );
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf?.view instanceof MarkdownView) this.navigation.track(leaf.view);
        else if (leaf?.view instanceof FileView || leaf?.view.getViewType() === 'empty')
          this.navigation.track(null);
        this.run(this.controller.followLeaf(leaf));
      }),
    );
    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        this.navigation.refresh();
        const view = this.markdownTarget();
        if (view) this.navigation.track(view);
      }),
    );
    this.registerEvent(
      this.app.workspace.on('editor-change', (_editor, info) => {
        if (info.file === this.controller.file) this.navigation.invalidate();
      }),
    );
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile) {
          this.readingRenderer.invalidate(file);
          this.navigation.sourceModified(file);
        }
      }),
    );
    this.registerEvent(
      this.app.vault.on('rename', (file) => {
        if (file instanceof TFile) this.readingRenderer.invalidate(file);
        if (this.controller.file === file) {
          this.navigation.invalidate();
          this.controller.refresh();
        }
      }),
    );
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile) this.readingRenderer.invalidate(file);
        if (this.controller.file === file) {
          this.navigation.track(null);
          this.run(this.controller.activate(null));
        }
      }),
    );
    this.registerMarkdownPostProcessor((element, context) =>
      this.readingRenderer.process(element, context),
    );
    this.app.workspace.onLayoutReady(() => {
      if (!this.alive) return;
      const view = this.markdownTarget();
      this.navigation.track(view);
      this.run(
        this.controller.activate(view?.file ?? this.app.workspace.getActiveFile(), view?.editor),
      );
    });
    this.styling.start();
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
    this.styling.appearanceChanged();
    const root = this.app.workspace.containerEl?.ownerDocument.body;
    if (root !== this.appearanceRoot) this.clearAppearance();
    if (!root) return;
    this.appearanceRoot = root;
    const settings = this.settings;
    root.setCssProps({
      '--local-tags-prefix-display': settings.hideTagPrefix ? 'none' : '',
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
    for (const view of this.controller.views)
      view.dispatch({ effects: refreshTagDisplay.of(null) });
  }

  private clearAppearance(): void {
    this.appearanceRoot?.setCssProps({
      '--local-tags-prefix-display': '',
      '--local-tags-padding-y-offset': '',
      '--local-tags-color': '',
      '--local-tags-background': '',
      '--local-tags-weight': '',
      '--local-tags-decoration': '',
      '--local-tags-style': '',
    });
    this.appearanceRoot = undefined;
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
    this.styling.dispose();
    this.settingsVersion++;
    this.clearAppearance();
    this.readingRenderer.stop();
    this.navigation.dispose();
    this.controller.dispose();
    this.readingRenderer.dispose();
  }
}
