import type { TFile } from 'obsidian';
import { markdownTree, parse } from './domain/parser.ts';
import type { Candidate, SyntaxNode } from './domain/parser.ts';

export class ReadingDocument {
  private readonly lineStarts = [0];
  private readonly candidates: Candidate[];
  private tree?: SyntaxNode;

  constructor(
    private readonly source: string,
    readonly isCurrent: () => boolean,
    parseSource = parse,
  ) {
    this.candidates = parseSource(source);
    for (let at = source.indexOf('\n'); at >= 0; at = source.indexOf('\n', at + 1))
      this.lineStarts.push(at + 1);
  }

  section(lineStart: number, lineEnd: number): { source: string; allowed: Candidate[] } | null {
    if (
      !Number.isInteger(lineStart) ||
      !Number.isInteger(lineEnd) ||
      lineStart < 0 ||
      lineEnd < lineStart ||
      lineEnd >= this.lineStarts.length
    )
      return null;
    const from = this.lineStarts[lineStart];
    if (from === undefined) return null;
    const next = this.lineStarts[lineEnd + 1];
    const to = next === undefined ? this.source.length : next - 1;
    return this.range(from, to);
  }

  /** Resolve a Live Preview block/cell using its editor position, never its displayed text. */
  widget(
    offset: number,
    cell?: { row: number; column: number },
  ): { source: string; allowed: Candidate[] } | null {
    this.tree ??= markdownTree(this.source);
    const find = (node: SyntaxNode): SyntaxNode | undefined => {
      const from = node.position?.start.offset;
      const to = node.position?.end.offset;
      if (
        from === undefined ||
        to === undefined ||
        (offset < from && !/^[ \t>]*$/.test(this.source.slice(offset, from))) ||
        offset >= to
      )
        return;
      if (cell && node.type === 'table') return node.children?.[cell.row]?.children?.[cell.column];
      for (const child of node.children ?? []) {
        const found = find(child);
        if (found) return found;
      }
      if (
        !cell &&
        node.type === 'blockquote' &&
        /^[ \t]*(?:>[ \t]*)+\[![^\]\r\n]+\][+-]?/.test(this.source.slice(from, to))
      )
        return node;
      return undefined;
    };
    const node = find(this.tree);
    // GFM cell positions include their surrounding pipes and padding.
    const from = (cell ? node?.children?.[0] : node)?.position?.start.offset;
    const to = (cell ? node?.children?.at(-1) : node)?.position?.end.offset;
    return from === undefined || to === undefined ? null : this.range(from, to);
  }

  private range(from: number, to: number): { source: string; allowed: Candidate[] } {
    // Candidates are ordered by source offset. Avoid scanning every tag per section.
    let low = 0;
    let high = this.candidates.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if ((this.candidates[middle]?.from ?? Infinity) < from) low = middle + 1;
      else high = middle;
    }
    const allowed: Candidate[] = [];
    for (let index = low; index < this.candidates.length; index++) {
      const tag = this.candidates[index];
      if (!tag || tag.from > to) break;
      if (tag.to <= to) allowed.push({ ...tag, from: tag.from - from, to: tag.to - from });
    }
    return { source: this.source.slice(from, to), allowed };
  }
}

interface SourceVersion {
  file: TFile;
  path: string;
  mtime: number;
  size: number;
  revision: object;
}
interface CacheEntry extends SourceVersion {
  promise: Promise<ReadingDocument | null>;
}

/** Keep one document, including its pending read. Never retain a vault-wide index. */
export class ReadingSourceCache {
  private entry?: CacheEntry;
  private readonly revisions = new WeakMap<TFile, object>();
  private disposed = false;

  constructor(
    private readonly readSource: (file: TFile) => Promise<string>,
    private readonly parseSource = parse,
  ) {}

  read(file: TFile): Promise<ReadingDocument | null> {
    if (this.disposed) return Promise.resolve(null);
    let revision = this.revisions.get(file);
    if (!revision) {
      revision = {};
      this.revisions.set(file, revision);
    }
    if (this.entry?.file === file && this.isCurrent(this.entry)) return this.entry.promise;
    const version: SourceVersion = {
      file,
      path: file.path,
      mtime: file.stat.mtime,
      size: file.stat.size,
      revision,
    };
    const promise = this.load(version);
    const entry = { ...version, promise };
    this.entry = entry;
    // Failed/stale reads must not poison the next attempt or evict a newer entry.
    void promise.then(
      (document) => {
        if (!document && this.entry === entry) this.entry = undefined;
      },
      () => {
        if (this.entry === entry) this.entry = undefined;
      },
    );
    return promise;
  }

  invalidate(file: TFile): void {
    this.revisions.set(file, {});
    if (this.entry?.file === file) this.entry = undefined;
  }

  dispose(): void {
    this.disposed = true;
    this.entry = undefined;
  }

  private isCurrent(version: SourceVersion): boolean {
    return (
      !this.disposed &&
      version.revision === this.revisions.get(version.file) &&
      version.path === version.file.path &&
      version.mtime === version.file.stat.mtime &&
      version.size === version.file.stat.size
    );
  }

  private async load(version: SourceVersion): Promise<ReadingDocument | null> {
    const source = await this.readSource(version.file);
    const isCurrent = (): boolean => this.isCurrent(version);
    if (!isCurrent()) return null;
    return new ReadingDocument(source, isCurrent, this.parseSource);
  }
}
