import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readDefinitions,
  settingsLayout,
  tagAtPosition,
  transform,
} from '../src/styling/document.ts';
import { resolveStyle } from '../src/styling/appearance.ts';
import { paletteStyles } from '../src/styling/palette.ts';

test('tag descriptions use only visible same-line text from exact tag definitions', () => {
  const source = [
    '# local-tags-config',
    '- ##project  Project %%hidden%%description<!-- hidden -->  ',
    '  continuation is not part of the description',
    '  - bold: on',
    '- ##project/review',
    '  - details Child content is not a description',
    '- ##project/other **Own** `%%literal%%` <b>description</b>',
    '- ##comment-only %%hidden%% <!-- hidden -->',
    '',
    '# Notes',
    '- ##outside Outside settings',
  ].join('\r\n');
  const parsed = readDefinitions(source);
  assert.deepEqual(
    [...parsed.synopses],
    [
      ['project', 'Project description'],
      ['project/other', '**Own** `%%literal%%` <b>description</b>'],
    ],
  );
  assert.deepEqual(parsed.definitions.get('project'), { bold: 'on' });
  assert.equal(readDefinitions('# Notes\n- ##tag Outside settings\n').synopses.size, 0);
});

test('invalid decoration values preserve descriptions while ambiguous definitions suppress them', () => {
  const parsed = readDefinitions(
    '# local-tags-config\n- ##project Project description\n  - bold: invalid\n' +
      '- ##duplicate First\n- ##duplicate Second\n',
  );
  assert.equal(parsed.ambiguous, true);
  assert.deepEqual([...parsed.synopses], [['project', 'Project description']]);
  for (const source of [
    '# local-tags-config\n- ##a First\n# local-tags-config\n- ##b Second\n',
    '# local-tags-config\n- ##a First\n\nOrdinary prose\n\n- ##b Second\n',
  ]) {
    const ambiguous = readDefinitions(source);
    assert.equal(ambiguous.ambiguous, true);
    assert.equal(ambiguous.synopses.size, 0);
  }
});

test('per-note decoration inherits missing and empty settings while applying child overrides', () => {
  const source = `## local-tags-config

- ##project
  - text-color: \\#ffffff
  - background-color: \\#174266
  - border-color: \\#5da9e9
  - bold: on
  - underline: off
  - italic:
- ##project/review
  - background-color: \\#49345c
  - bold: off
  - underline: on
- ##project/review/empty

## Notes

Discuss ##project/review/empty here.
`;
  const parsed = readDefinitions(source);
  const shared = { italic: 'on' };
  assert.deepEqual(parsed.diagnostics, []);
  assert.deepEqual(parsed.definitions.get('project/review/empty'), {});
  assert.deepEqual(resolveStyle('project/review/empty', parsed.definitions, new Set(), shared), {
    'text-color': '#ffffff',
    'background-color': '#49345c',
    'border-color': '#5da9e9',
    bold: 'off',
    underline: 'on',
    italic: 'on',
  });
  assert.deepEqual(resolveStyle('other', parsed.definitions, new Set(), shared), shared);
});

test('invalid values report their tag and inherit without invalidating other settings', () => {
  const source = `# local-tags-config
- ##project
  - text-color: #123456
  - bold: on
- ##project/review
  - text-color: red
  - bold: yes
  - underline: on
`;
  const parsed = readDefinitions(source);
  assert.equal(parsed.invalidTags.size, 0);
  assert.deepEqual(parsed.definitions.get('project/review'), { underline: 'on' });
  assert.deepEqual(resolveStyle('project/review', parsed.definitions), {
    'text-color': '#123456',
    bold: 'on',
    underline: 'on',
  });
  assert.deepEqual(
    parsed.diagnostics.map(({ severity, tag, line, message }) => ({
      severity,
      tag,
      line,
      message,
    })),
    [
      {
        severity: 'error',
        tag: 'project/review',
        line: 6,
        message: 'Invalid value for text-color',
      },
      { severity: 'error', tag: 'project/review', line: 7, message: 'Invalid value for bold' },
    ],
  );
  assert.throws(() => transform(source, { kind: 'ensure' }), /Invalid value for text-color/u);
});

test('adding missing settings preserves values, orders attributes, and creates only recognized tags', () => {
  const source = `# local-tags-config
- ##first
  - italic: off
  - bold: on

# Notes
##first ##second/child \`##code\`
`;
  const expected = `# local-tags-config
- ##first
  - text-color:
  - background-color:
  - border-color:
  - bold: on
  - underline:
  - italic: off
- ##second/child
  - text-color:
  - background-color:
  - border-color:
  - bold:
  - underline:
  - italic:

# Notes
##first ##second/child \`##code\`
`;
  const result = transform(source, { kind: 'ensure' });
  assert.equal(result, expected);
  assert.equal(transform(result, { kind: 'ensure' }), result);
  assert.deepEqual(
    [...readDefinitions(result).definitions],
    [
      ['first', { bold: 'on', italic: 'off' }],
      ['second/child', {}],
    ],
  );
  assert.deepEqual(readDefinitions(result).diagnostics, []);

  const created = transform('# Notes\n##new\n', { kind: 'ensure' });
  assert.match(created, /^## local-tags-config\n\n- ##new\n/u);
  assert.deepEqual([...readDefinitions(created).definitions], [['new', {}]]);
  assert.equal(transform(created, { kind: 'ensure' }), created);
});

test('removing empty settings retains declarations and sorts values across child lists', () => {
  const source = `# local-tags-config
- ##first
  - italic: off
  - bold:

  Keep this paragraph.

  - text-color: #123456
- ##second
  - bold:
  - italic:
`;
  const expected = `# local-tags-config
- ##first
  - text-color: #123456

  Keep this paragraph.

  - italic: off
- ##second
`;
  const result = transform(source, { kind: 'remove-empty' });
  assert.equal(result, expected);
  assert.equal(transform(result, { kind: 'remove-empty' }), result);
  assert.deepEqual(
    [...readDefinitions(result).definitions],
    [
      ['first', { 'text-color': '#123456', italic: 'off' }],
      ['second', {}],
    ],
  );
});

test('configuration writes reject duplicate definitions and insertions inside unclosed comments', () => {
  const duplicate = '# local-tags-config\n- ##project\n- ##project\n';
  assert.equal(readDefinitions(duplicate).ambiguous, true);
  assert.throws(() => transform(duplicate, { kind: 'sort' }), /Duplicate tag definitions/u);
  for (const marker of ['<!-- unclosed', '%% unclosed']) {
    const source = `# local-tags-config\n- ##project\n  - bold: on ${marker}`;
    assert.deepEqual(readDefinitions(source).diagnostics, []);
    assert.throws(() => transform(source, { kind: 'ensure' }), /comment/u);
    assert.throws(() => transform(source, { kind: 'ensure' }), /comment/u);
  }
});

test('random decoration changes the caret target while preserving exclusions and emphasis', () => {
  const source = `# local-tags-config
- ##project
  - text-color: #123456
  - bold: on
- ##project/review
  - .text-color: #ffffff
  - background-color: #000000
  - bold: off
  - underline: on
  - italic: off

# Notes
##project/review
`;
  const layout = settingsLayout(source);
  assert.equal(
    tagAtPosition(source, source.indexOf('background-color:'), layout),
    'project/review',
  );
  assert.equal(tagAtPosition(source, source.lastIndexOf('##project/review'), layout), null);
  const operation = { kind: 'random-tag', tag: 'project/review', expectedSource: source };
  const result = transform(source, operation, () => 0.5);
  const parsed = readDefinitions(result);
  assert.deepEqual(parsed.definitions.get('project'), { 'text-color': '#123456', bold: 'on' });
  const child = parsed.definitions.get('project/review');
  assert.equal(child['text-color'], '#ffffff');
  assert.notEqual(child['background-color'], '#000000');
  assert.match(child['border-color'], /^#[0-9a-f]{6}$/u);
  assert.deepEqual(
    { bold: child.bold, underline: child.underline, italic: child.italic },
    { bold: 'off', underline: 'on', italic: 'off' },
  );
  assert.throws(() => transform(source + 'changed', operation), /document changed/iu);
});

test('the fixed vivid complementary palette produces colors without randomizing emphasis', () => {
  const styles = paletteStyles(3, { pattern: 'vivid', harmony: 'complementary' }, () => 0.5);
  assert.equal(styles.length, 3);
  for (const style of styles) {
    assert.deepEqual(Object.keys(style), ['text-color', 'background-color', 'border-color']);
    assert.ok(Object.values(style).every((value) => /^#[0-9a-f]{6}$/u.test(value)));
  }
  assert.throws(
    () => paletteStyles(1, { pattern: 'pastel', harmony: 'complementary' }),
    /vivid complementary/u,
  );
  assert.throws(
    () => paletteStyles(1, { pattern: 'vivid', harmony: 'analogous' }),
    /vivid complementary/u,
  );
});
