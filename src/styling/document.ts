import { classify, isTagCharacter, markdownTree, parse } from '../domain/parser.ts';
import type { SyntaxNode } from '../domain/parser.ts';
import { paletteStyles } from './palette.ts';
import { styleKeys } from './types.ts';
import type {
  Definitions,
  Diagnostic,
  ColorKey,
  Operation,
  SettingsLayout,
  SourceRange,
  StyleKey,
  TagStyle,
} from './types.ts';

interface Node extends SyntaxNode {
  depth?: number;
  children?: Node[];
}
interface Property {
  key: StyleKey;
  value: string;
  valid: boolean;
  node: Node;
  randomExcluded: boolean;
  from: number;
  to: number;
}
interface Entry {
  name: string;
  synopsis: string;
  node: Node;
  list: Node;
  style?: Node;
  randomExcluded: boolean;
  properties: Property[];
  invalid: boolean;
}
interface Document extends Definitions {
  tree: Node;
  masked: string;
  comments: SourceRange[];
  section?: { heading: Node; to: number };
  entries: Entry[];
}
interface Change {
  from: number;
  to: number;
  insert: string;
}

const settingOrder: readonly StyleKey[] = [
  'text-color',
  'background-color',
  'border-color',
  'bold',
  'underline',
  'italic',
];
const colors = new Set<StyleKey>(['text-color', 'background-color', 'border-color']);
const start = (node: Node): number => node.position?.start.offset ?? 0;
const end = (node: Node): number => node.position?.end.offset ?? 0;
const lineEnding = (source: string): string => (source.includes('\r\n') ? '\r\n' : '\n');
const firstLine = (source: string, node: Node): string =>
  source.slice(start(node), end(node)).split(/\r?\n/u)[0] ?? '';
const validName = (name: string): boolean =>
  classify(name) === 'valid' && [...name].every(isTagCharacter);
const isStyleKey = (key: string): key is StyleKey => styleKeys.some((known) => known === key);
const isColorKey = (key: StyleKey): key is ColorKey => colors.has(key);
const validColor = (value: string): boolean => /^#[0-9a-f]{6}$/iu.test(value);
const colorValue = (value: string): string => value.replace(/^\\#/u, '#');
const renderedValue = (key: StyleKey, value: string): string =>
  isColorKey(key) ? `\\${value}` : value;

/** Mask comments without changing UTF-16 offsets or line endings. */
function maskComments(source: string): {
  masked: string;
  comments: SourceRange[];
} {
  const protectedRanges: SourceRange[] = [];
  const comments: SourceRange[] = [];
  const protect = (node: Node): void => {
    if (['code', 'inlineCode', 'yaml'].includes(node.type)) {
      protectedRanges.push({ from: start(node), to: end(node) });
      return;
    }
    node.children?.forEach(protect);
  };
  protect(markdownTree(source));
  protectedRanges.sort((a, b) => a.from - b.from);
  const masked: string[] = [];
  let cursor = 0;
  let copied = 0;
  let rangeIndex = 0;
  while (cursor < source.length) {
    while (rangeIndex < protectedRanges.length && protectedRanges[rangeIndex]!.to <= cursor)
      rangeIndex++;
    const protectedRange = protectedRanges[rangeIndex];
    if (protectedRange && cursor >= protectedRange.from && cursor < protectedRange.to) {
      cursor = protectedRange.to;
      continue;
    }
    const marker = source.startsWith('%%', cursor)
      ? { close: '%%', width: 2 }
      : source.startsWith('<!--', cursor)
        ? { close: '-->', width: 4 }
        : undefined;
    if (!marker) {
      cursor++;
      continue;
    }
    const closing = source.indexOf(marker.close, cursor + marker.width);
    const to = closing < 0 ? source.length : closing + marker.close.length;
    comments.push({ from: cursor, to });
    masked.push(source.slice(copied, cursor), source.slice(cursor, to).replace(/[^\r\n]/g, ' '));
    cursor = to;
    copied = to;
  }
  return { masked: masked.join('') + source.slice(copied), comments };
}

function synopsisText(source: string, comments: SourceRange[], from: number, to: number): string {
  const parts: string[] = [];
  let cursor = from;
  for (const comment of comments) {
    if (comment.to <= cursor) continue;
    if (comment.from >= to) break;
    parts.push(source.slice(cursor, Math.max(cursor, comment.from)));
    cursor = Math.min(to, comment.to);
  }
  parts.push(source.slice(cursor, to));
  return parts.join('').trim();
}

function document(source: string): Document {
  const { masked, comments } = maskComments(source);
  const tree: Node = markdownTree(masked);
  const root = tree.children ?? [];
  const result: Document = {
    tree,
    masked,
    comments,
    entries: [],
    definitions: new Map(),
    synopses: new Map(),
    invalidTags: new Set(),
    diagnostics: [],
    ambiguous: false,
  };
  const diagnostic = (
    severity: Diagnostic['severity'],
    message: string,
    node: Node,
    tag?: string,
  ): void => {
    result.diagnostics.push({
      severity,
      message,
      tag,
      line: source.slice(0, start(node)).split('\n').length,
    });
  };
  const headings = root.filter(
    (node) =>
      node.type === 'heading' &&
      node.children?.length === 1 &&
      node.children[0]?.type === 'text' &&
      ['local-tags-config', 'local-tags'].includes(node.children[0].value ?? ''),
  );
  if (headings.length > 1) {
    result.ambiguous = true;
    diagnostic(
      'error',
      'local-tags-config / local-tags Duplicate configuration headings',
      headings[1]!,
    );
    return result;
  }
  const heading = headings[0];
  if (!heading) return result;
  const index = root.indexOf(heading);
  const next = root
    .slice(index + 1)
    .find((node) => node.type === 'heading' && (node.depth ?? 0) <= (heading.depth ?? 0));
  const to = next ? start(next) : source.length;
  const nodes = root.slice(index + 1).filter((node) => start(node) < to);
  result.section = { heading, to };
  for (const list of nodes) {
    if (list.type !== 'list') {
      diagnostic(
        'warning',
        'Ignored an element outside the configuration list and preserved its source',
        list,
      );
      continue;
    }
    for (const node of list.children ?? []) {
      const line = firstLine(masked, node);
      const match = /^[-+*][ \t]+##([^\s]+)(?:[ \t]|$)/u.exec(line);
      if (!match) {
        diagnostic('warning', 'Ignored an unknown list item and preserved its source', node);
        continue;
      }
      const name = match[1] ?? '';
      const entry: Entry = {
        name,
        synopsis: synopsisText(
          source,
          comments,
          start(node) + match[0].length,
          start(node) + line.length,
        ),
        node,
        list,
        properties: [],
        randomExcluded: false,
        invalid: false,
      };
      const error = (message: string, target = node): void => {
        entry.invalid = true;
        diagnostic('error', message, target, name);
      };
      if (!validName(name)) error('Invalid tag name');
      const childLists = (node.children ?? []).filter((child) => child.type === 'list');
      const childItems = childLists.flatMap((child) => child.children ?? []);
      const styles = childItems.filter((child) =>
        /^[-+*][ \t]+\.?(?:style|\u88c5\u98fe)[ \t]*$/u.test(firstLine(masked, child)),
      );
      if (styles.length > 1) error('Duplicate style groups');
      entry.style = styles[0];
      entry.randomExcluded = Boolean(
        entry.style && /^[-+*][ \t]+\./u.test(firstLine(masked, entry.style)),
      );
      const properties = [
        ...childItems.filter((child) => !styles.includes(child)),
        ...(entry.style?.children ?? [])
          .filter((child) => child.type === 'list')
          .flatMap((child) => child.children ?? []),
      ];
      for (const property of properties) {
        const raw = firstLine(masked, property);
        const parsed = /^[-+*][ \t]+([^:\s]+):[ \t]*(.*?)[ \t]*$/u.exec(raw);
        const rawKey = parsed?.[1] ?? '';
        const randomExcluded = rawKey.startsWith('.');
        const key = randomExcluded ? rawKey.slice(1) : rawKey;
        if (!parsed || !isStyleKey(key)) {
          diagnostic(
            'warning',
            `Ignored unknown style attribute${rawKey ? ` ${rawKey}` : ''} and preserved its source`,
            property,
            name,
          );
          continue;
        }
        if (entry.style && childItems.includes(property))
          error('Direct style attributes and a style group cannot be mixed', property);
        const rawValue = parsed[2] ?? '';
        const value = isColorKey(key) ? colorValue(rawValue) : rawValue;
        const valid = isColorKey(key) ? validColor(value) : ['on', 'off'].includes(value);
        const prefix = /^[-+*][ \t]+[^:\s]+:[ \t]*/u.exec(raw)?.[0] ?? '';
        const from = start(property) + prefix.length;
        entry.properties.push({
          key,
          value,
          valid,
          node: property,
          randomExcluded,
          from,
          to: from + rawValue.length,
        });
        if (!valid && value !== '') diagnostic('error', `Invalid value for ${key}`, property, name);
        if (entry.properties.filter((item) => item.key === key).length > 1)
          error(`Duplicate ${key} attribute`, property);
      }
      result.entries.push(entry);
    }
  }
  const names = new Map<string, Entry[]>();
  for (const entry of result.entries)
    names.set(entry.name, [...(names.get(entry.name) ?? []), entry]);
  for (const [name, entries] of names) {
    if (entries.length < 2) continue;
    result.ambiguous = true;
    for (const entry of entries) entry.invalid = true;
    diagnostic('error', 'Duplicate tag definitions', entries[1]!.node, name);
  }
  const independentLists = new Set(result.entries.map((entry) => entry.list)).size > 1;
  if (independentLists) {
    result.ambiguous = true;
    diagnostic('error', 'Configuration entries are split across separate lists', heading);
  }
  for (const entry of result.entries) {
    if (
      entry.synopsis &&
      validName(entry.name) &&
      names.get(entry.name)?.length === 1 &&
      !independentLists
    )
      result.synopses.set(entry.name, entry.synopsis);
    if (entry.invalid) result.invalidTags.add(entry.name);
    else
      result.definitions.set(
        entry.name,
        Object.fromEntries(
          entry.properties
            .filter((property) => property.valid)
            .map(({ key, value }) => [key, value]),
        ),
      );
  }
  return result;
}

export function readDefinitions(source: string): Definitions {
  const { definitions, synopses, invalidTags, diagnostics, ambiguous } = document(source);
  return { definitions, synopses, invalidTags, diagnostics, ambiguous };
}

/** Returns original source coordinates without changing configuration state. */
export function settingsLayout(source: string): SettingsLayout | null {
  const parsed = document(source);
  if (!parsed.section || parsed.ambiguous) return null;
  return {
    section: {
      from: start(parsed.section.heading),
      to: parsed.section.to,
      heading: {
        from: start(parsed.section.heading),
        to: end(parsed.section.heading),
      },
    },
    tags: parsed.entries.map((entry) => ({
      name: entry.name,
      from: start(entry.node),
      to: end(entry.node),
      colors: entry.properties
        .filter(
          (property): property is Property & { key: ColorKey } =>
            isColorKey(property.key) && validColor(property.value),
        )
        .map(({ key, value, from, to }) => ({ key, value, from, to })),
    })),
  };
}

/** Find the setting block at a UTF-16 caret offset; a supplied layout must match source. */
export function tagAtPosition(
  source: string,
  position: number,
  layout?: SettingsLayout | null,
): string | null {
  if (!Number.isInteger(position) || position < 0 || position > source.length) return null;
  const current = layout === undefined ? settingsLayout(source) : layout;
  if (!current) return null;
  for (const tag of current.tags) {
    const lineStart = source.lastIndexOf('\n', tag.from - 1) + 1;
    const from = /^[ \t]*$/u.test(source.slice(lineStart, tag.from)) ? lineStart : tag.from;
    // The caret at the last character boundary belongs to its nonempty line.
    // The following newline and trailing blank lines belong to no block.
    if (position >= from && position <= tag.to) return tag.name;
  }
  return null;
}

function apply(source: string, changes: Change[]): string {
  for (const change of changes.sort((a, b) => b.from - a.from))
    source = source.slice(0, change.from) + change.insert + source.slice(change.to);
  return source;
}

function closedComment(source: string, comment: SourceRange): boolean {
  const raw = source.slice(comment.from, comment.to);
  return raw.startsWith('%%')
    ? raw.length >= 4 && raw.endsWith('%%')
    : raw.length >= 7 && raw.endsWith('-->');
}

function assertInsertionOutsideComments(source: string, comments: SourceRange[], at: number): void {
  for (const comment of comments) {
    if (comment.from >= at) break;
    if (at < comment.to || (at === comment.to && !closedComment(source, comment)))
      throw new Error('Cannot insert settings inside a comment.');
  }
}

function appendDefinitions(source: string, parsed: Document, names: string[]): string {
  if (!names.length) return source;
  const eol = lineEnding(source);
  const rendered = names.map((name) => `- ##${name}`).join(eol);
  if (!parsed.section) {
    const yaml = parsed.tree.children?.find((node) => node.type === 'yaml');
    let at = yaml ? end(yaml) : 0;
    if (source.slice(at, at + eol.length) === eol) at += eol.length;
    assertInsertionOutsideComments(source, parsed.comments, at);
    const before = source.slice(0, at);
    const separator = before && !before.endsWith(eol) ? eol : '';
    return `${before}${separator}## local-tags-config${eol}${eol}${rendered}${eol}${eol}${source.slice(at)}`;
  }
  const list = parsed.entries[0]?.list;
  if (list) {
    const first = list.children?.[0];
    const marker = first ? firstLine(parsed.masked, first)[0] : '-';
    const insert = names.map((name) => `${marker} ##${name}`).join(eol);
    const at = end(list);
    assertInsertionOutsideComments(source, parsed.comments, at);
    return `${source.slice(0, at)}${eol}${insert}${source.slice(at)}`;
  }
  const at = end(parsed.section.heading);
  assertInsertionOutsideComments(source, parsed.comments, at);
  const after = source.slice(at);
  const separator = after.startsWith(eol + eol) ? '' : after.startsWith(eol) ? eol : eol + eol;
  return `${source.slice(0, at)}${eol}${eol}${rendered}${separator}${after}`;
}

function childIndent(source: string, node: Node): string {
  const line = source.lastIndexOf('\n', start(node)) + 1;
  const before = source.slice(line, start(node));
  const prefix = /^[-+*][ \t]+/u.exec(firstLine(source, node))?.[0] ?? '- ';
  return before + prefix.replace(/[^\t]/g, ' ');
}

function appendStyleProperties(
  source: string,
  entry: Entry,
  properties: ReadonlyArray<readonly [StyleKey, string]>,
  comments: SourceRange[],
): Change[] {
  if (!properties.length) return [];
  const parent = entry.style ?? entry.node;
  const list = entry.style?.children?.find((node) => node.type === 'list');
  const marker = list?.children?.[0] ? firstLine(source, list.children[0])[0] : '-';
  const indent = childIndent(source, parent);
  const at = list ? end(list) : end(parent);
  assertInsertionOutsideComments(source, comments, at);
  const eol = lineEnding(source);
  return [
    {
      from: at,
      to: at,
      insert: properties
        .map(
          ([key, value]) =>
            `${eol}${indent}${marker} ${key}:${value ? ` ${renderedValue(key, value)}` : ''}`,
        )
        .join(''),
    },
  ];
}

function emptyPropertyChanges(source: string, masked: string, property: Property): Change[] {
  const node = property.node;
  const newline = source.indexOf('\n', start(node));
  const lineEnd = newline < 0 ? source.length : newline;
  if (masked.slice(lineEnd, end(node)).trim()) return [];
  const lineStart = source.lastIndexOf('\n', start(node) - 1) + 1;
  const to = source[lineEnd - 1] === '\r' ? lineEnd - 1 : lineEnd;
  const prefix = /^[-+*][ \t]+([^:\s]+):/u.exec(firstLine(masked, node))!;
  const keyEnd = start(node) + prefix[0].length;
  const keyStart = keyEnd - prefix[1]!.length - 1;
  const remaining =
    source.slice(lineStart, start(node)) +
    source.slice(start(node) + 1, keyStart).trimStart() +
    source.slice(keyEnd, to).trimStart();
  if (remaining.trim()) return [{ from: lineStart, to, insert: remaining }];
  const from = Math.max(0, lineStart - (source[lineStart - 2] === '\r' ? 2 : 1));
  return [{ from, to, insert: '' }];
}

function propertyRange(source: string, parsed: Document, property: Property): SourceRange {
  const lineEnd = (position: number): number => {
    const newline = source.indexOf('\n', position);
    const at = newline < 0 ? source.length : newline;
    return source[at - 1] === '\r' ? at - 1 : at;
  };
  const from = source.lastIndexOf('\n', start(property.node) - 1) + 1;
  let to = lineEnd(Math.max(start(property.node), end(property.node) - 1));
  for (const comment of parsed.comments) {
    if (comment.from > to) break;
    if (comment.to <= from) continue;
    if (comment.from < from || !closedComment(source, comment))
      throw new Error('Cannot sort a setting with an unclosed or shared-line comment.');
    to = Math.max(to, lineEnd(comment.to - 1));
  }
  return { from, to };
}

function indentationWidth(prefix: string): number {
  let width = 0;
  for (const character of prefix) width += character === '\t' ? 4 - (width % 4) : 1;
  return width;
}

function propertyText(
  source: string,
  node: Node,
  original: SourceRange,
  target: SourceRange,
): string {
  const text = source.slice(original.from, original.to);
  const originalPrefix = /^[ \t]*[-+*][ \t]+/u.exec(text)![0];
  const targetPrefix = /^[ \t]*[-+*][ \t]+/u.exec(source.slice(target.from, target.to))![0];
  if (originalPrefix === targetPrefix) return text;
  const newline = text.indexOf('\n');
  const headerEnd = newline < 0 ? text.length : newline;
  const header = targetPrefix + text.slice(originalPrefix.length, headerEnd);
  const body = text.slice(headerEnd);
  const originalWidth = indentationWidth(originalPrefix);
  const difference = indentationWidth(targetPrefix) - originalWidth;
  if (!difference) return header + body;
  const codeIndentations: Array<SourceRange & { width: number }> = [];
  const collectCode = (child: Node): void => {
    if (child.type === 'code') {
      const from = source.lastIndexOf('\n', start(child) - 1) + 1;
      const prefix = source.slice(from, start(child));
      const fenced = /^(?:`{3,}|~{3,})/u.test(firstLine(source, child));
      const inlineListFence = fenced && /^[ \t]*(?:(?:[-+*]|\d{1,9}[.)])[ \t]+)+$/u.test(prefix);
      if (/^[ \t]*$/u.test(prefix) || inlineListFence) {
        codeIndentations.push({
          from: inlineListFence ? start(child) : from,
          to: end(child),
          width: indentationWidth(prefix) + (fenced ? 0 : 4),
        });
      }
      return;
    }
    child.children?.forEach(collectCode);
  };
  collectCode(node);
  return (
    header +
    body.replace(/(\n)([ \t]+)/gu, (line, newline: string, indent: string, offset: number) => {
      const position = original.from + headerEnd + offset + newline.length;
      const code = codeIndentations.find((range) => range.from <= position && position < range.to);
      if (code) {
        let consumed = 0;
        let boundary = 0;
        for (const character of indent) {
          if (consumed >= code.width) break;
          consumed += character === '\t' ? 4 - (consumed % 4) : 1;
          boundary++;
        }
        return (
          newline +
          ' '.repeat(code.width + difference + Math.max(0, consumed - code.width)) +
          indent.slice(boundary)
        );
      }
      const after = body[offset + line.length];
      if (after === undefined || after === '\r' || after === '\n') return line;
      const width = indentationWidth(indent);
      return width < originalWidth ? line : newline + ' '.repeat(width + difference);
    })
  );
}

function sortProperties(source: string): string {
  const parsed = document(source);
  assertWritable(parsed);
  const changes: Change[] = [];
  for (const entry of parsed.entries) {
    const properties = entry.properties;
    const ordered = [...properties].sort(
      (left, right) => settingOrder.indexOf(left.key) - settingOrder.indexOf(right.key),
    );
    if (ordered.every((property, index) => property === properties[index])) continue;
    const ranges = properties.map((property) => propertyRange(source, parsed, property));
    for (let index = 1; index < ranges.length; index++)
      if (ranges[index]!.from < ranges[index - 1]!.to)
        throw new Error('Cannot sort overlapping setting and comment ranges.');
    for (const [index, property] of ordered.entries()) {
      const original = ranges[properties.indexOf(property)]!;
      changes.push({
        ...ranges[index]!,
        insert: propertyText(source, property.node, original, ranges[index]!),
      });
    }
  }
  return apply(source, changes);
}

function styleChanges(
  source: string,
  entry: Entry,
  style: TagStyle,
  comments: SourceRange[],
): Change[] {
  const changes: Change[] = [];
  const missing: StyleKey[] = [];
  if (entry.style) {
    const group = /^([-+*][ \t]+\.?)\u88c5\u98fe/u.exec(firstLine(source, entry.style));
    if (group) {
      const from = start(entry.style) + group[1]!.length;
      changes.push({ from, to: from + '\u88c5\u98fe'.length, insert: 'style' });
    }
  }
  for (const key of styleKeys) {
    const value = style[key];
    if (value === undefined) continue;
    const property = entry.properties.find((item) => item.key === key);
    if (property) changes.push({ ...property, insert: renderedValue(key, value) });
    else missing.push(key);
  }
  return changes.concat(
    appendStyleProperties(
      source,
      entry,
      missing.map((key) => [key, style[key]!]),
      comments,
    ),
  );
}

function randomStyleChanges(
  source: string,
  entry: Entry,
  style: TagStyle,
  comments: SourceRange[],
): Change[] {
  if (entry.randomExcluded) return [];
  const editable = { ...style };
  for (const property of entry.properties) {
    if (property.randomExcluded) delete editable[property.key];
  }
  return Object.keys(editable).length ? styleChanges(source, entry, editable, comments) : [];
}

function assertWritable(parsed: Document): void {
  const errors = parsed.diagnostics.filter((item) => item.severity === 'error');
  if (parsed.ambiguous || errors.length)
    throw new Error(
      errors.map((item) => `${item.tag ? `##${item.tag}: ` : ''}${item.message}`).join('\n'),
    );
}

export function transform(source: string, operation: Operation, random = Math.random): string {
  if (operation.kind === 'color' && source !== operation.expectedSource)
    throw new Error('The document changed while choosing a color. The update was canceled.');
  if (operation.kind === 'random-tag' && source !== operation.expectedSource)
    throw new Error(
      'The document changed after selecting the target tag. The update was canceled.',
    );
  const parsed = document(source);
  assertWritable(parsed);
  if (operation.kind === 'color') {
    if (!isColorKey(operation.key) || !validColor(operation.value))
      throw new Error('Invalid color value.');
    const entry = parsed.entries.find((item) => item.name === operation.tag);
    if (!entry) throw new Error(`##${operation.tag}: Cannot locate the target tag definition`);
    return apply(
      source,
      styleChanges(source, entry, { [operation.key]: operation.value }, parsed.comments),
    );
  }
  if (operation.kind === 'random-tag') {
    const entry = parsed.entries.find((item) => item.name === operation.tag);
    if (!entry) throw new Error(`##${operation.tag}: Cannot locate the target tag definition`);
    if (entry.randomExcluded) return source;
    const style = paletteStyles(1, operation.palette, random, operation.options)[0]!;
    return apply(source, randomStyleChanges(source, entry, style, parsed.comments));
  }
  if (operation.kind === 'sort') {
    const ordered = [...parsed.entries].sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
    return apply(
      source,
      parsed.entries.map((entry, index) => ({
        from: start(entry.node),
        to: end(entry.node),
        insert: source.slice(start(ordered[index]!.node), end(ordered[index]!.node)),
      })),
    );
  }
  const names = [
    ...new Set(
      parse(source)
        .filter((tag) => tag.kind === 'valid')
        .map((tag) => tag.name),
    ),
  ];
  if (operation.kind === 'ensure') {
    const updated = appendDefinitions(
      source,
      parsed,
      names.filter((name) => !parsed.definitions.has(name)),
    );
    const current = document(updated);
    assertWritable(current);
    return sortProperties(
      apply(
        updated,
        current.entries.flatMap((entry) =>
          appendStyleProperties(
            updated,
            entry,
            settingOrder
              .filter((key) => !entry.properties.some((property) => property.key === key))
              .map((key) => [key, '']),
            current.comments,
          ),
        ),
      ),
    );
  }
  if (operation.kind === 'remove-empty')
    return sortProperties(
      apply(
        source,
        parsed.entries.flatMap((entry) =>
          entry.properties
            .filter((property) => property.value === '')
            .flatMap((property) => emptyPropertyChanges(source, parsed.masked, property)),
        ),
      ),
    );
  const roots = [...new Set(names.map((name) => name.split('/')[0]!))].filter(
    (name) =>
      !parsed.entries.find((entry) => entry.name === name)?.randomExcluded &&
      (!operation.onlyUnset || !Object.keys(parsed.definitions.get(name) ?? {}).length),
  );
  const updated = appendDefinitions(
    source,
    parsed,
    roots.filter((name) => !parsed.definitions.has(name)),
  );
  const current = document(updated);
  assertWritable(current);
  const palette = paletteStyles(roots.length, operation.palette, random, operation.options);
  const changes = roots.flatMap((name, index) => {
    const entry = current.entries.find((item) => item.name === name);
    if (!entry) throw new Error(`##${name}: Cannot locate the target tag definition`);
    return randomStyleChanges(updated, entry, palette[index]!, current.comments);
  });
  return apply(updated, changes);
}
