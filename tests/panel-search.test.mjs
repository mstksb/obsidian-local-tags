import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom } from './helpers/dom.mjs';
import { fixture, app, file } from './helpers/bundle.mjs';

const source = [
  '# local-tags-config',
  '- ##Project Planning overview',
  '- ##Project/Alpha Design owner',
  '- ##Project/Beta Urgent review',
  '- ##Archive Finished project',
  '- ##人物/田中 External contact',
  '',
  '# Notes',
  '##Project/Alpha ##Project/Beta ##Archive ##人物/田中',
].join('\n');

async function setup(t) {
  fixture.setTestLanguage('en');
  const dom = createDom('<main></main>');
  const { document } = dom.window;
  const notes = new Map();
  for (const [path, text] of [
    ['A.md', source],
    ['B.md', source.replace('Design owner', 'Different owner')],
  ]) {
    const note = { file: file(path), source: text };
    note.view = new fixture.MarkdownView(note.file, { getValue: () => note.source });
    note.view.getMode = () => 'source';
    note.view.getViewData = () => note.source;
    note.view.containerEl = document.createElement('section');
    document.querySelector('main').append(note.view.containerEl);
    notes.set(path, note);
  }
  const host = app(async (target) => notes.get(target.path).source);
  host.vault.getFileByPath = (path) => notes.get(path)?.file ?? null;
  host.workspace.containerEl = document.querySelector('main');
  host.workspace.getLeavesOfType = (type) =>
    type === 'markdown' ? [...notes.values()].map(({ view }) => ({ view })) : [];
  host.workspace.getActiveViewOfType = () => notes.get('A.md').view;
  const plugin = new fixture.LocalTagsPlugin(host);
  plugin.onload();
  await plugin.settingsLoad;
  for (const note of notes.values()) await plugin.styling.reload(note.file);
  const activate = (path) => {
    const note = notes.get(path);
    return plugin.controller.activate(note.file, note.view.editor);
  };
  await activate('A.md');
  const root = document.createElement('section');
  const content = document.createElement('div');
  content.className = 'view-content';
  root.append(content);
  document.querySelector('main').append(root);
  const jumps = [];
  const panel = new fixture.PrivateTagView(
    { app: host, element: root },
    plugin.controller,
    (tag, path) => jumps.push({ tag, path }),
    plugin.styling,
  );
  panel.contentEl = content;
  await panel.onOpen();
  const closePanel = () => {
    for (const cleanup of panel.cleanups.splice(0)) cleanup();
  };
  t.after(() => {
    closePanel();
    plugin.onunload();
    dom.window.close();
  });
  const input = content.querySelector('input[type="search"]');
  return {
    dom,
    document,
    content,
    panel,
    plugin,
    notes,
    input,
    jumps,
    activate,
    closePanel,
    names: () =>
      [...content.querySelectorAll('.local-tags-tree-link')].map((a) => a.dataset.localTag),
    target: (name) => content.querySelector(`input[type="checkbox"][name="${name}"]`),
    search(value) {
      input.value = value;
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    },
  };
}

test('panel input and target checkboxes filter exact descriptions while retaining ancestor context', async (t) => {
  const h = await setup(t);
  assert.equal(h.input.getAttribute('aria-label'), 'Search tags');
  assert.equal(h.target('name').labels[0].textContent, 'Tag name');
  assert.equal(h.target('summary').labels[0].textContent, 'Summary');
  assert.equal(h.target('name').checked, true);
  assert.equal(h.target('summary').checked, true);
  h.search('pRoJeCt');
  assert.deepEqual(h.names(), ['Archive', 'Project', 'Project/Alpha', 'Project/Beta']);
  h.target('name').click();
  assert.deepEqual(h.names(), ['Archive']);
  h.search('PLANNING');
  assert.deepEqual(h.names(), ['Project']);
  h.target('summary').click();
  assert.deepEqual(h.names(), []);
  assert.equal(h.content.querySelector('[role="status"]').hidden, false);
  h.search('   ');
  assert.equal(h.names().length, 6);
  h.target('name').click();
  h.search('  田中  ');
  assert.deepEqual(h.names(), ['人物', '人物/田中']);
});

test('file switches and description reloads preserve the query and input focus, and closing unsubscribes', async (t) => {
  const h = await setup(t);
  h.target('name').click();
  h.input.focus();
  h.search('design');
  h.input.setSelectionRange(3, 3);
  assert.deepEqual(h.names(), ['Project', 'Project/Alpha']);
  await h.activate('B.md');
  assert.deepEqual(h.names(), []);
  const note = h.notes.get('B.md');
  note.source = note.source.replace('Different owner', 'Design reviewer');
  await h.plugin.styling.reload(note.file);
  assert.deepEqual(h.names(), ['Project', 'Project/Alpha']);
  assert.equal(h.content.querySelector('input[type="search"]'), h.input);
  assert.equal(h.document.activeElement, h.input);
  assert.equal(h.input.selectionStart, 3);
  assert.equal(h.input.value, 'design');
  assert.equal(h.target('name').checked, false);
  note.source = note.source.replace(' Design reviewer', '');
  await h.plugin.styling.reload(note.file);
  assert.deepEqual(h.names(), []);
  let redraws = 0;
  h.panel.draw = () => redraws++;
  h.closePanel();
  note.source = source;
  await h.plugin.styling.reload(note.file);
  assert.equal(redraws, 0);
});

test('filtered tag links retain current-file search and Shift-click navigation', async (t) => {
  const h = await setup(t);
  h.search('uRgEnT');
  assert.deepEqual(h.names(), ['Project', 'Project/Beta']);
  const anchor = h.content.querySelector('[data-local-tag="Project/Beta"]');
  let ordinaryPrevented;
  anchor.addEventListener('click', (event) => {
    ordinaryPrevented = event.defaultPrevented;
    event.preventDefault();
  });
  anchor.dispatchEvent(new h.dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(ordinaryPrevented, false);
  assert.match(anchor.href, /^obsidian:\/\/search\?/);
  assert.equal(
    new URL(anchor.href).searchParams.get('query'),
    'match-case:(path:/^A\\u002emd$/ content:"##Project/Beta")',
  );
  anchor.dispatchEvent(
    new h.dom.window.MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }),
  );
  assert.equal(ordinaryPrevented, true);
  assert.deepEqual(h.jumps, [{ tag: 'Project/Beta', path: 'A.md' }]);
  h.search('');
  assert.equal(h.names().length, 6);
  assert.equal(h.content.querySelector('[data-local-tag="Project/Beta"]').href, anchor.href);
});
