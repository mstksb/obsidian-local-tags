import { readingLocation } from '../reading.ts';

interface Match {
  path: string;
  from: number;
  to: number;
}

/** Paint a visual line without wrapping text or including nested blocks. */
export class RenderedNavigationHighlight {
  private readonly markers = new Set<HTMLElement>();
  private readonly blocks = new Set<HTMLElement>();
  private readonly mutationObserver?: MutationObserver;
  private readonly resizeObserver?: ResizeObserver;
  private disposed = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly match: Match,
    private readonly isCurrent: () => boolean,
  ) {
    const window = root.ownerDocument.defaultView;
    if (window) {
      this.mutationObserver = new window.MutationObserver(() => this.refresh());
      this.mutationObserver.observe(root, { childList: true, subtree: true });
      if (window.ResizeObserver) {
        this.resizeObserver = new window.ResizeObserver(() => this.refresh());
        this.resizeObserver.observe(root);
      }
    }
    this.refresh();
  }

  refresh(): void {
    if (this.disposed) return;
    const previousBlocks = new Set(this.blocks);
    this.clear();
    if (!this.isCurrent()) {
      this.dispose();
      return;
    }
    const bands = new Map<HTMLElement, { top: number; bottom: number }>();
    for (const marker of this.root.querySelectorAll<HTMLElement>('[data-local-tags-reading]')) {
      if (marker.closest('.markdown-embed,.internal-embed')) continue;
      const location = readingLocation(marker);
      if (
        !location?.isCurrent() ||
        location.path !== this.match.path ||
        location.from !== this.match.from ||
        location.to !== this.match.to
      )
        continue;
      marker.classList.add('local-tags-current-match');
      marker.dataset.localTagsMatchPath = this.match.path;
      marker.dataset.localTagsMatchFrom = String(this.match.from);
      marker.dataset.localTagsMatchTo = String(this.match.to);
      this.markers.add(marker);
      const block =
        marker.closest<HTMLElement>('td,th') ??
        marker.closest<HTMLElement>('p,li,h1,h2,h3,h4,h5,h6,.callout-title-inner') ??
        marker.parentElement;
      if (!block || !this.root.contains(block)) continue;
      const bounds = block.getBoundingClientRect();
      const lineHeight = Number.parseFloat(
        block.ownerDocument.defaultView?.getComputedStyle(block).lineHeight ?? '',
      );
      for (const rect of marker.getClientRects()) {
        if (!rect.width || !rect.height) continue;
        const height = Math.max(rect.height, Number.isFinite(lineHeight) ? lineHeight : 0);
        const top = Math.max(
          0,
          (rect.top + rect.bottom - height) / 2 - bounds.top - block.clientTop,
        );
        const bottom = Math.min(bounds.height, top + height);
        const previous = bands.get(block);
        bands.set(block, {
          top: Math.min(previous?.top ?? top, top),
          bottom: Math.max(previous?.bottom ?? bottom, bottom),
        });
      }
    }
    for (const [block, band] of bands) {
      block.classList.add('local-tags-current-line');
      block.style.setProperty('--local-tags-match-top', `${band.top}px`);
      block.style.setProperty('--local-tags-match-bottom', `${band.bottom}px`);
      this.blocks.add(block);
    }
    for (const block of previousBlocks)
      if (!this.blocks.has(block)) this.resizeObserver?.unobserve(block);
    for (const block of this.blocks)
      if (!previousBlocks.has(block)) this.resizeObserver?.observe(block);
  }

  dispose(): void {
    this.disposed = true;
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.clear();
  }

  private clear(): void {
    for (const marker of this.markers) {
      marker.classList.remove('local-tags-current-match');
      delete marker.dataset.localTagsMatchPath;
      delete marker.dataset.localTagsMatchFrom;
      delete marker.dataset.localTagsMatchTo;
    }
    this.markers.clear();
    for (const block of this.blocks) {
      block.classList.remove('local-tags-current-line');
      block.style.removeProperty('--local-tags-match-top');
      block.style.removeProperty('--local-tags-match-bottom');
    }
    this.blocks.clear();
  }
}
