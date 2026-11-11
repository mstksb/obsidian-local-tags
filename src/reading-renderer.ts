import { editorInfoField } from 'obsidian';
import type { App, MarkdownPostProcessorContext, TFile } from 'obsidian';
import type { EditorView } from '@codemirror/view';
import { editorReadingSection } from './editor/reading.ts';
import { clearReading, decorateReading } from './reading.ts';
import { ReadingSourceCache } from './reading-source.ts';
import type { ReadingDocument } from './reading-source.ts';

export interface ReadingRendererOptions {
  isActive(): boolean;
  views(): Iterable<EditorView>;
  synchronizeReading(file: TFile, document: ReadingDocument): void;
  run(work: Promise<unknown>): void;
}

/** Coordinates Reading ownership and freshness without owning plugin registrations. */
export class ReadingRenderer {
  private readonly app: App;
  private readonly options: ReadingRendererOptions;
  private readonly sources: ReadingSourceCache;
  private readonly requests = new WeakMap<HTMLElement, object>();
  private readonly elements = new Map<HTMLElement, () => boolean>();
  private stopped = false;

  constructor(app: App, options: ReadingRendererOptions) {
    this.app = app;
    this.options = options;
    this.sources = new ReadingSourceCache((file) => this.app.vault.cachedRead(file));
  }

  process(element: HTMLElement, context: MarkdownPostProcessorContext): void {
    if (!this.isActive()) return;
    const request = {};
    this.requests.set(element, request);
    const initialInfo = context.getSectionInfo(element);
    const initialRange = initialInfo
      ? { lineStart: initialInfo.lineStart, lineEnd: initialInfo.lineEnd }
      : null;
    const file = this.app.vault.getFileByPath(context.sourcePath);
    if (!file) return;
    this.options.run(
      this.sources.read(file).then((document) => {
        // Live Preview renders callouts and individual table cells without section info.
        // Wait until the widget is attached, then resolve against the current editor buffer.
        const editorSection = !initialRange
          ? editorReadingSection(element, this.options.views(), context.sourcePath)
          : null;
        if (
          !this.isActive() ||
          this.requests.get(element) !== request ||
          !(editorSection?.isCurrent() ?? document?.isCurrent()) ||
          context.sourcePath !== file.path
        )
          return;
        if (editorSection) {
          decorateReading(
            element,
            editorSection.source,
            editorSection.allowed,
            editorSection.showPrefix,
            {
              path: context.sourcePath,
              offset: editorSection.from,
              isCurrent: editorSection.isCurrent,
            },
          );
          this.track(element);
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
        const offset = document.lineOffset(info.lineStart);
        if (offset === undefined) return;
        this.options.synchronizeReading(file, document);
        decorateReading(element, section.source, section.allowed, undefined, {
          path: context.sourcePath,
          offset,
          isCurrent: document.isCurrent,
        });
        this.track(element, () => {
          const current = context.getSectionInfo(element);
          return (
            // A source update does not discard unchanged rendered sections.
            this.requests.get(element) === request &&
            context.sourcePath === file.path &&
            current?.lineStart === info.lineStart &&
            current.lineEnd === info.lineEnd
          );
        });
      }),
    );
  }

  invalidate(file: TFile): void {
    this.sources.invalidate(file);
  }

  refreshEditor(view: EditorView): void {
    if (!this.isActive()) return;
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
      decorateReading(element, section.source, section.allowed, section.showPrefix, {
        path,
        offset: section.from,
        isCurrent: section.isCurrent,
      });
      this.track(element);
    }
  }

  private track(element: HTMLElement, owned = () => element.isConnected): void {
    this.elements.set(element, owned);
    // Bound ownership references when sections are re-rendered.
    for (const [old, isOwned] of this.elements)
      if (!isOwned()) {
        clearReading(old);
        this.elements.delete(old);
      }
  }

  /** Stop reads before the plugin releases navigation and document services. */
  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.sources.dispose();
  }

  /** Clear every tracked section, including owned sections outside the DOM. */
  dispose(): void {
    this.stop();
    for (const element of this.elements.keys()) clearReading(element);
    this.elements.clear();
  }

  private isActive(): boolean {
    return !this.stopped && this.options.isActive();
  }
}
