import { decodeString } from 'micromark-util-decode-string';
import { config } from './config.ts';
import { calloutMarkers, markdownTree, parse } from './domain/parser.ts';
import type { Candidate, Span, SyntaxNode } from './domain/parser.ts';

type ReadingMark = Pick<Candidate, 'from' | 'to' | 'kind' | 'name'>;

interface Segment {
  value: string;
  marks: ReadingMark[];
  reference?: WikiReference;
}

interface WikiReference extends Span {
  target: string;
  embed: boolean;
}

/** Keep Obsidian's opaque references out of CommonMark's inline parsing. */
function wikiReferences(source: string, tree: SyntaxNode): WikiReference[] {
  if (!source.includes('[[')) return [];
  const literal: Span[] = [...source.matchAll(/%%[\s\S]*?(?:%%|$)/g)].map((match) => ({
    from: match.index,
    to: match.index + match[0].length,
  }));
  literal.push(...calloutMarkers(source, tree));
  const visit = (node: SyntaxNode): void => {
    if (
      [
        'code',
        'inlineCode',
        'link',
        'image',
        'linkReference',
        'imageReference',
        'definition',
      ].includes(node.type)
    ) {
      const from = node.position?.start.offset;
      const to = node.position?.end.offset;
      if (from !== undefined && to !== undefined) literal.push({ from, to });
      return;
    }
    node.children?.forEach(visit);
  };
  visit(tree);
  const references: WikiReference[] = [];
  for (const match of source.matchAll(/!?\[\[([^\n]*?)\]\]/g)) {
    const from = match.index;
    if (literal.some((range) => from >= range.from && from < range.to)) continue;
    let backslashes = 0;
    for (let at = from - 1; at >= 0 && source[at] === '\\'; at--) backslashes++;
    if (backslashes % 2) continue;
    references.push({
      from,
      to: from + match[0].length,
      target: decodeString((match[1] ?? '').split(/\\?\|/)[0] ?? ''),
      embed: match[0].startsWith('!'),
    });
  }
  return references;
}

function normalizeWhitespace(source: string): {
  value: string;
  offsets: number[];
} {
  let value = '';
  const offsets: number[] = [];
  for (let index = 0; index < source.length; index++) {
    const character = source[index] ?? '';
    if (/\s/u.test(character)) {
      if (value.endsWith(' ')) continue;
      value += ' ';
    } else value += character;
    offsets.push(index);
  }
  offsets.push(source.length);
  return { value, offsets };
}

function segments(source: string, allowed = parse(source), highlight = false): Segment[] {
  const candidates = allowed.filter((tag) => tag.kind !== 'plain');
  let tree = markdownTree(source);
  const references = wikiReferences(source, tree);
  if (references.length) {
    let masked = '';
    let cursor = 0;
    for (const reference of references) {
      // Symbols retain the brackets' punctuation class for adjacent emphasis.
      masked +=
        source.slice(cursor, reference.from) + '\uFFFC'.repeat(reference.to - reference.from);
      cursor = reference.to;
    }
    tree = markdownTree(masked + source.slice(cursor));
  }
  const comments = [...source.matchAll(/%%[\s\S]*?(?:%%|$)/g)].map((match) => ({
    from: match.index,
    to: match.index + match[0].length,
  }));
  comments.push(...calloutMarkers(source, tree));
  // Obsidian's ==highlight== extension is rendered as <mark>, outside CommonMark.
  if (highlight) {
    for (const match of source.matchAll(/(?<![\\=])==(?=\S)([^\n]*?\S)==(?!=)/g)) {
      comments.push(
        { from: match.index, to: match.index + 2 },
        {
          from: match.index + match[0].length - 2,
          to: match.index + match[0].length,
        },
      );
    }
  }
  comments.sort((a, b) => a.from - b.from);
  const definitions = new Map<string, string>();
  const collectDefinitions = (node: SyntaxNode & { identifier?: string; url?: string }): void => {
    if (
      node.type === 'definition' &&
      node.identifier &&
      node.url &&
      !definitions.has(node.identifier)
    )
      definitions.set(node.identifier, node.url);
    node.children?.forEach(collectDefinitions);
  };
  if (references.length) collectDefinitions(tree);
  const visible = (from: number, to: number): string => {
    let text = '';
    let cursor = from;
    for (const comment of comments) {
      if (comment.to <= cursor || comment.from >= to) continue;
      text += source.slice(cursor, Math.max(cursor, comment.from));
      cursor = Math.min(to, comment.to);
    }
    return decodeString((text + source.slice(cursor, to)).replace(/\n[ \t]*(?:>[ \t]*)+/g, '\n'));
  };
  const result: Segment[] = [];
  function visit(node: SyntaxNode): void {
    const from = node.position?.start.offset;
    const to = node.position?.end.offset;
    if (from === undefined || to === undefined) return;
    const text = (textFrom: number, textTo: number): void => {
      const value = visible(textFrom, textTo);
      const marks = candidates
        .filter(
          (tag) =>
            tag.from >= textFrom &&
            tag.to <= textTo &&
            !comments.some((comment) => tag.from >= comment.from && tag.from < comment.to),
        )
        .map((tag) => ({
          from: visible(textFrom, tag.from).length,
          to: visible(textFrom, tag.to).length,
          kind: tag.kind,
          name: tag.name,
        }));
      result.push({ value, marks });
    };
    if (node.type === 'text') {
      let cursor = from;
      for (const reference of references) {
        if (reference.to <= from || reference.from >= to) continue;
        if (cursor < reference.from) text(cursor, reference.from);
        result.push({ value: '', marks: [], reference });
        cursor = reference.to;
      }
      if (cursor < to) text(cursor, to);
    } else if (references.length && (node.type === 'image' || node.type === 'imageReference')) {
      const image = node as SyntaxNode & { identifier?: string; url?: string };
      result.push({
        value: '',
        marks: [],
        reference: {
          from,
          to,
          target: image.url ?? definitions.get(image.identifier ?? '') ?? '',
          embed: true,
        },
      });
    } else if (node.type === 'code' || node.type === 'inlineCode') {
      result.push({ value: node.value ?? '', marks: [] });
    } else if (node.type === 'html') {
      const value = decodeString(
        (node.value ?? '').replace(
          /<!--[\s\S]*?(?:-->|$)|<\/?[a-zA-Z][\w:-]*(?:\s+(?:[^>"']|"[^"]*"|'[^']*')*)?\s*\/?>/g,
          '',
        ),
      );
      result.push({ value, marks: [] });
    } else {
      node.children?.forEach(visit);
    }
  }
  visit(tree);
  return result;
}

export function clearReading(element: HTMLElement): void {
  element.querySelectorAll('[data-local-tags-reading]').forEach((span) => {
    span.replaceWith(...span.childNodes);
  });
}

/** Align source text segments to rendered text before marking; never parse displayed text as Markdown. */
export function decorateReading(
  element: HTMLElement,
  source: string,
  allowed?: Candidate[],
): number {
  // Post processors may be called again on a decorated element or a child.
  // Never mutate the editor renderer's DOM or wrap an existing tag style.
  if (element.closest('[data-local-tags-editor],[data-local-tags-reading]')) return 0;
  // Embedded documents own their decorations independently.
  const embedded = (node: HTMLElement): boolean => {
    const embed = node.closest('.internal-embed');
    return Boolean(embed && embed !== element && element.contains(embed));
  };
  element.querySelectorAll<HTMLElement>('[data-local-tags-reading]').forEach((span) => {
    if (embedded(span)) return;
    span.replaceWith(...span.childNodes);
  });
  const document = element.ownerDocument;
  const ownerWindow = document.defaultView;
  if (!ownerWindow) return 0;
  const walker = document.createTreeWalker(element, 5); // SHOW_ELEMENT | SHOW_TEXT, across realms.
  const nodes: { node: Text; from: number; to: number; forbidden: boolean }[] = [];
  let flat = '';
  const references: { from: number; to: number; element: HTMLElement }[] = [];
  let reference: (typeof references)[number] | undefined;
  while (walker.nextNode()) {
    const current = walker.currentNode;
    if (reference && !reference.element.contains(current)) reference = undefined;
    if (walker.currentNode.nodeType !== 3) {
      if (!reference && (current as HTMLElement).matches('a.internal-link,.internal-embed,img')) {
        reference = { from: flat.length, to: flat.length, element: current as HTMLElement };
        references.push(reference);
      }
      if (walker.currentNode.nodeName === 'BR') flat += '\n';
      if (reference) reference.to = flat.length;
      continue;
    }
    const node = walker.currentNode as Text;
    const from = flat.length;
    flat += node.data;
    if (reference) reference.to = flat.length;
    nodes.push({
      node,
      from,
      to: flat.length,
      forbidden:
        embedded(node.parentElement!) ||
        Boolean(node.parentElement?.closest('a,code,pre,script,style,[data-local-tags-editor]')),
    });
  }
  const marks: ReadingMark[] = [];
  const normalized = normalizeWhitespace(flat);
  const normalizedOffset = (offset: number): number => {
    let low = 0;
    let high = normalized.offsets.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if ((normalized.offsets[middle] ?? flat.length) < offset) low = middle + 1;
      else high = middle;
    }
    return low;
  };
  let cursor = 0;
  let referenceIndex = 0;
  for (const segment of segments(
    source,
    allowed,
    element.matches('mark') || Boolean(element.querySelector('mark')),
  )) {
    if (segment.reference) {
      while (references[referenceIndex]) {
        const previous = references[referenceIndex]!;
        const end = normalizedOffset(previous.to);
        // Compare normalized boundaries, including empty embeds within a whitespace run.
        if (end > cursor || (end === cursor && previous.from === previous.to)) break;
        referenceIndex++;
      }
      const reference = references[referenceIndex++];
      if (!reference || !reference.element.matches('a.internal-link') !== segment.reference.embed) {
        continue;
      }
      const to = normalizedOffset(reference.to);
      cursor = to;
      continue;
    }
    if (!segment.value) continue;
    const value = normalizeWhitespace(segment.value).value;
    // Whitespace at an opaque boundary may collapse with the following text.
    const start =
      value.startsWith(' ') && normalized.value[cursor - 1] === ' ' ? cursor - 1 : cursor;
    const at = normalized.value.indexOf(value, start);
    if (at < 0) {
      // Another renderer may change individual segments; do not guess their text.
      continue;
    }
    for (const mark of segment.marks) {
      const from =
        normalized.offsets[
          at + normalizeWhitespace(segment.value.slice(0, mark.from)).value.length
        ];
      const to =
        normalized.offsets[at + normalizeWhitespace(segment.value.slice(0, mark.to)).value.length];
      if (from !== undefined && to !== undefined) marks.push({ ...mark, from, to });
    }
    cursor = at + value.length;
  }
  let count = 0;
  for (const entry of nodes) {
    if (entry.forbidden) continue;
    const intersecting = marks.filter((mark) => mark.from < entry.to && entry.from < mark.to);
    if (intersecting.length === 0) continue;
    const fragment = ownerWindow.createFragment();
    let offset = 0;
    for (const mark of intersecting) {
      const from = Math.max(0, mark.from - entry.from);
      const to = Math.min(entry.node.length, mark.to - entry.from);
      fragment.append(entry.node.data.slice(offset, from));
      const span = ownerWindow.createSpan();
      span.dataset.localTagsReading = 'true';
      span.className = mark.kind === 'error' ? config.errorClass : config.tagClass;
      span.textContent = entry.node.data.slice(from, to);
      fragment.append(span);
      offset = to;
      count++;
    }
    fragment.append(entry.node.data.slice(offset));
    entry.node.replaceWith(fragment);
  }
  return count;
}
