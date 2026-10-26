import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/domain/parser.ts';
import { PrivateTagIndex } from '../src/domain/index.ts';

const names = (source) =>
  parse(source)
    .filter((tag) => tag.kind === 'valid')
    .map((tag) => tag.name);

test('tags accept Unicode names and hierarchy with strict prefix and escaping rules', () => {
  assert.deepEqual(names('##人物/田中 ##-draft ##_note ##😀/予定?next'), [
    '人物/田中',
    '-draft',
    '_note',
    '😀/予定',
  ]);
  assert.deepEqual(names('###tag ####tag abc##tag \\##escaped ## heading'), []);
  assert.deepEqual(names('##one\t##two　##three'), ['one', 'two', 'three']);
  const source = '😀 ##人物';
  const [tag] = parse(source);
  assert.equal(source.slice(tag.from, tag.to), '##人物');
});

test('numbers remain text, invalid hierarchy is marked, and case is preserved', () => {
  assert.deepEqual(
    parse('##123 ##2026/123 ##/person ##person/ ##person//name ##Name ##name ##').map(
      ({ name, kind }) => [name, kind],
    ),
    [
      ['123', 'plain'],
      ['2026/123', 'plain'],
      ['/person', 'error'],
      ['person/', 'error'],
      ['person//name', 'error'],
      ['Name', 'valid'],
      ['name', 'valid'],
      ['', 'plain'],
    ],
  );
  assert.deepEqual(names('##year/2026 ##2026/plan ##1984年'), ['year/2026', '2026/plan', '1984年']);
});

test('Markdown code, metadata, links and HTML are excluded while note comments are indexed', () => {
  const source = [
    '---',
    'memo: "##metadata"',
    '---',
    '',
    '`##inline` ##outside',
    '',
    '```md',
    '##block',
    '```',
    '',
    '[##label](https://example.com/##url) ![##image](image.png)',
    '[[##wiki]] ![[##embed]] https://example.com/##bare',
    '<span>##html</span> ##visible',
    '%% ##comment %%',
  ].join('\n');
  assert.deepEqual(names(source), ['outside', 'visible', 'comment']);
  assert.deepEqual(names('> [!note] ##title\n> ##body\n\n| label |\n| --- |\n| ##cell |'), [
    'title',
    'body',
    'cell',
  ]);
});

test('completion ranks and limits distinct names from only the current file', () => {
  const index = new PrivateTagIndex();
  index.replace('A.md', parse('##aa ##aa/child ##bb/aa ##cc/aa ##aa ##AA ##invalid/ ##123'));
  assert.deepEqual(index.suggest('aa'), ['aa', 'aa/child', 'bb/aa', 'cc/aa']);
  assert.deepEqual(index.suggest('AA'), ['AA']);
  index.replace('B.md', parse(Array.from({ length: 12 }, (_, i) => `##tag${i}`).join(' ')));
  assert.deepEqual(index.suggest('aa'), []);
  assert.deepEqual(index.suggest(''), [
    'tag0',
    'tag1',
    'tag10',
    'tag11',
    'tag2',
    'tag3',
    'tag4',
    'tag5',
    'tag6',
    'tag7',
  ]);
  index.replace(null, []);
  assert.deepEqual(index.names(), []);
});

test('the hierarchy merges repeated names and creates sorted parent rows', () => {
  const index = new PrivateTagIndex();
  index.replace('A.md', parse('##people/Bob ##people/Alice ##people/Bob ##A/b ##a/b'));
  assert.deepEqual(index.tree(), [
    { name: 'A', path: 'A', children: [{ name: 'b', path: 'A/b', children: [] }] },
    { name: 'a', path: 'a', children: [{ name: 'b', path: 'a/b', children: [] }] },
    {
      name: 'people',
      path: 'people',
      children: [
        { name: 'Alice', path: 'people/Alice', children: [] },
        { name: 'Bob', path: 'people/Bob', children: [] },
      ],
    },
  ]);
});
