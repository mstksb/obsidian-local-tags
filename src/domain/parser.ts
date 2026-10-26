import { fromMarkdown } from 'mdast-util-from-markdown';
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { frontmatter } from 'micromark-extension-frontmatter';
import { gfm } from 'micromark-extension-gfm';

export interface Span {
  from: number;
  to: number;
}
export interface Candidate extends Span {
  name: string;
  kind: 'valid' | 'error' | 'plain';
}
export interface SyntaxNode {
  type: string;
  position?: { start: { offset?: number }; end: { offset?: number } };
  children?: SyntaxNode[];
  value?: string;
}

const excludedTypes = new Set([
  'code',
  'inlineCode',
  'yaml',
  'link',
  'image',
  'linkReference',
  'imageReference',
  'definition',
]);
const voidElements = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export function isTagCharacter(character: string): boolean {
  return (
    /^[\p{L}\p{M}\p{N}_/-]$/u.test(character) ||
    ((character.codePointAt(0) ?? 0) > 127 && /^[\p{S}\p{Emoji_Component}]$/u.test(character))
  );
}

export function classify(name: string): Candidate['kind'] {
  if (!name) return 'plain';
  if (name.startsWith('/') || name.endsWith('/') || name.includes('//')) return 'error';
  return /^[\p{N}/]+$/u.test(name) ? 'plain' : 'valid';
}

function overlaps(a: Span, b: Span): boolean {
  return a.from < b.to && b.from < a.to;
}

export function markdownTree(source: string): SyntaxNode {
  return fromMarkdown(source, {
    extensions: [frontmatter(['yaml']), gfm()],
    mdastExtensions: [frontmatterFromMarkdown(['yaml']), gfmFromMarkdown()],
  });
}

/** Obsidian accepts arbitrary callout types; their marker is metadata, not inline HTML. */
export function calloutMarkers(source: string, tree = markdownTree(source)): Span[] {
  const markers: Span[] = [];
  const visit = (node: SyntaxNode): void => {
    if (node.type === 'blockquote') {
      const paragraph = node.children?.[0];
      const from = paragraph?.type === 'paragraph' ? paragraph.position?.start.offset : undefined;
      if (from !== undefined) {
        const marker = /^\[![^\]\r\n]+\][+-]?[ \t]*/.exec(source.slice(from));
        if (marker) markers.push({ from, to: from + marker[0].length });
      }
    }
    node.children?.forEach(visit);
  };
  visit(tree);
  return markers;
}

export function excludedRanges(source: string): Span[] {
  const ranges: Span[] = [];
  const structural: Span[] = [];
  const tree = markdownTree(source);
  const markers = calloutMarkers(source, tree);
  ranges.push(...markers);
  structural.push(...markers);
  function visit(node: SyntaxNode): void {
    const from = node.position?.start.offset;
    const to = node.position?.end.offset;
    if (
      (excludedTypes.has(node.type) || node.type === 'html') &&
      from !== undefined &&
      to !== undefined
    ) {
      ranges.push({ from, to });
      if (node.type !== 'html') structural.push({ from, to });
      return;
    }
    node.children?.forEach(visit);
  }
  visit(tree);
  for (const match of source.matchAll(
    /!?\[\[[^\n]*?(?:\]\]|$)|\b[a-z][a-z\d+.-]*:\/\/[^\s<>]+/gim,
  )) {
    const span = { from: match.index, to: match.index + match[0].length };
    ranges.push(span);
    structural.push(span);
  }
  // Pair inline HTML too: CommonMark emits <span>, body, </span> as separate nodes.
  const stack: { name: string; from: number }[] = [];
  const html =
    /<!--[\s\S]*?(?:-->|$)|<![A-Z][^>]*>|<\/?([a-zA-Z][\w:-]*)(?:\s+(?:[^>"']|"[^"]*"|'[^']*')*)?\s*\/?>/g;
  for (const match of source.matchAll(html)) {
    const span = { from: match.index, to: match.index + match[0].length };
    if (structural.some((range) => overlaps(range, span))) continue;
    ranges.push(span);
    const name = match[1]?.toLowerCase();
    if (!name) continue;
    if (match[0].startsWith('</')) {
      const index = stack.map((item) => item.name).lastIndexOf(name);
      if (index >= 0) {
        const opened = stack[index];
        if (opened) ranges.push({ from: opened.from, to: span.to });
        stack.splice(index);
      }
    } else if (!voidElements.has(name) && !match[0].endsWith('/>'))
      stack.push({ name, from: span.from });
  }
  for (const opened of stack) ranges.push({ from: opened.from, to: source.length });
  return ranges
    .sort((a, b) => a.from - b.from || a.to - b.to)
    .reduce<Span[]>((merged, range) => {
      const previous = merged.at(-1);
      if (previous && range.from <= previous.to) previous.to = Math.max(previous.to, range.to);
      else merged.push({ ...range });
      return merged;
    }, []);
}

function previousCharacter(source: string, at: number): string {
  if (at === 0) return '';
  const code = source.charCodeAt(at - 1);
  return source.slice(at - (code >= 0xdc00 && code <= 0xdfff ? 2 : 1), at);
}

export function parse(source: string): Candidate[] {
  const excluded = excludedRanges(source);
  const result: Candidate[] = [];
  for (let at = source.indexOf('##'); at >= 0; at = source.indexOf('##', at + 2)) {
    if (excluded.some((range) => at >= range.from && at < range.to)) continue;
    const previous = previousCharacter(source, at);
    if (previous === '#' || (previous && isTagCharacter(previous)) || source[at + 2] === '#')
      continue;
    let backslashes = 0;
    for (let index = at - 1; index >= 0 && source[index] === '\\'; index--) backslashes++;
    if (backslashes % 2 === 1) continue;
    let to = at + 2;
    while (to < source.length) {
      const point = source.codePointAt(to);
      if (point === undefined) break;
      const character = String.fromCodePoint(point);
      if (!isTagCharacter(character)) break;
      to += character.length;
    }
    if (excluded.some((range) => overlaps({ from: at, to }, range))) continue;
    const name = source.slice(at + 2, to);
    result.push({ from: at, to, name, kind: classify(name) });
  }
  return result;
}

export function candidateAt(
  candidates: readonly Candidate[],
  position: number,
): Candidate | undefined {
  return candidates.find((candidate) => position >= candidate.from + 2 && position <= candidate.to);
}
