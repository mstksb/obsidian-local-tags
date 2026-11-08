import test from 'node:test';
import assert from 'node:assert/strict';
import { navigationCandidates } from '../src/domain/navigation.ts';
import { createDom } from './helpers/dom.mjs';
import { fixture } from './helpers/bundle.mjs';

const {
  LocalTagsPlugin,
  MarkdownView,
  TFile,
  EditorState,
  EditorView,
  documentField,
  editorInfoField,
  editorLivePreviewField,
  editorExtension,
  navigationHighlight,
  setNavigationHighlight,
  decorateReading,
  clearReading,
  readingLocation,
  RenderedNavigationHighlight,
} = fixture;

test('panel Shift-click cycles parent and descendant tags without changing selections or search links', async () => {
  const dom = createDom('<main></main><aside></aside>');
  const source = 'intro\n##a ##a/b ##ab `##a` ##a';
  const file = new TFile('A.md');
  const events = new Map();
  const registerEvent = (name, callback) => {
    const previous = events.get(name);
    events.set(name, (...args) => {
      previous?.(...args);
      callback(...args);
    });
    return {};
  };
  const scrolls = [];
  const editor = {
    getValue: () => source,
    offsetToPos: (offset) => ({ line: 1, ch: offset - 6 }),
    setSelection: () => assert.fail('Navigation must preserve the editor selection'),
    scrollIntoView: (...range) => scrolls.push(range),
  };
  const view = new MarkdownView(file, editor);
  view.containerEl = dom.window.document.querySelector('main');
  let sourceMode = true;
  const leaf = { view, getViewState: () => ({ state: { source: sourceMode } }) };
  view.leaf = leaf;
  view.getMode = () => 'source';
  view.getViewData = () => source;
  const app = {
    vault: { getName: () => 'Example Vault', on: () => ({}), cachedRead: async () => source },
    workspace: {
      on: registerEvent,
      onLayoutReady: () => {},
      getActiveViewOfType: () => view,
      getLeavesOfType: (type) => (type === 'markdown' ? [leaf] : []),
      detachLeavesOfType: () => {},
    },
  };
  const plugin = new LocalTagsPlugin(app);
  let panelFactory;
  plugin.registerView = (_type, factory) => {
    panelFactory = factory;
  };
  plugin.onload();
  const cm = {
    dom: view.containerEl,
    contentDOM: dom.window.document.querySelector('main'),
    state: EditorState.create({
      doc: source,
      selection: {
        ranges: [
          { anchor: 0, head: 3 },
          { anchor: 4, head: 5 },
        ],
        mainIndex: 1,
      },
      extensions: [
        EditorState.allowMultipleSelections.of(true),
        documentField,
        navigationHighlight,
        editorInfoField.init(() => ({ file, editor })),
      ],
    }),
    dispatch(spec) {
      this.state = this.state.update(spec).state;
    },
  };
  const selection = cm.state.selection.toJSON();
  plugin.controller.views.add(cm);
  try {
    events.get('file-open')(file);
    await Promise.resolve();
    const panel = panelFactory({ app, element: dom.window.document.querySelector('aside') });
    const panelContainer = dom.window.document.createElement('section');
    panel.contentEl.className = 'view-content';
    panel.contentEl.replaceWith(panelContainer);
    panelContainer.append(panel.contentEl);
    panel.containerEl = panelContainer;
    await panel.onOpen();
    const anchor = [...panel.contentEl.querySelectorAll('a')].find(
      (node) => node.textContent === 'a',
    );
    const click = (options = {}) => {
      const event = new dom.window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ...options,
      });
      anchor.dispatchEvent(event);
      return event;
    };
    const searchUri = anchor.href;
    assert.match(anchor.getAttribute('aria-label'), /Shift\+click/u);
    for (const [from, to] of [
      [6, 9],
      [10, 15],
      [27, 30],
      [6, 9],
    ]) {
      assert.equal(click({ shiftKey: true }).defaultPrevented, true);
      await plugin.navigation.queue;
      assert.deepEqual(cm.state.field(navigationHighlight), { path: 'A.md', from, to });
      assert.deepEqual(cm.state.selection.toJSON(), selection);
      assert.equal(cm.state.doc.toString(), source);
    }
    assert.equal(scrolls.length, 4);
    for (const options of [
      {},
      { shiftKey: true, ctrlKey: true },
      { shiftKey: true, metaKey: true },
      { shiftKey: true, altKey: true },
      { shiftKey: true, button: 1 },
    ]) {
      assert.equal(click(options).defaultPrevented, false);
      assert.equal(anchor.href, searchUri);
    }
    await plugin.navigation.queue;
    assert.equal(scrolls.length, 4);
    events.get('editor-change')(editor, { file });
    assert.equal(cm.state.field(navigationHighlight), null);
    click({ shiftKey: true });
    await plugin.navigation.queue;
    assert.equal(cm.state.field(navigationHighlight).from, 6);
    sourceMode = false;
    events.get('layout-change')();
    assert.equal(cm.state.field(navigationHighlight), null);
    click({ shiftKey: true });
    await plugin.navigation.queue;
    assert.equal(cm.state.field(navigationHighlight).from, 6);
    plugin.onunload();
    assert.equal(cm.state.field(navigationHighlight), null);
  } finally {
    plugin.onunload();
    dom.window.close();
  }
});

test('Source and Live Preview outline the existing tag while keeping prefix visibility and cursor state', () => {
  for (const live of [false, true]) {
    const controller = { views: new Set(), observe() {} };
    let state = EditorState.create({
      doc: '##a ##b',
      selection: { anchor: 7 },
      extensions: [
        editorExtension(controller, undefined, () => true),
        editorInfoField.init(() => ({ file: { path: 'A.md' } })),
        editorLivePreviewField.init(() => live),
      ],
    });
    const selection = state.selection.toJSON();
    state = state.update({
      effects: setNavigationHighlight.of({ path: 'A.md', from: 0, to: 3 }),
    }).state;
    const marks = [];
    for (const decorations of state.facet(EditorView.decorations)) {
      if (typeof decorations === 'function') continue;
      decorations.between(0, state.doc.length, (from, to, value) => {
        marks.push({ from, to, ...value.spec });
      });
    }
    const tag = marks.find((mark) => mark.class === 'local-tags-tag local-tags-current-match');
    assert.deepEqual([tag.from, tag.to], [0, 3]);
    assert.equal(tag.attributes['data-local-tags-editor'], 'true');
    assert.equal(tag.attributes['data-local-tags-match-from'], '0');
    assert.deepEqual(
      marks.filter((mark) => !mark.class).map(({ from, to }) => [from, to]),
      live ? [[0, 2]] : [],
    );
    assert.deepEqual(state.selection.toJSON(), selection);
    state = state.update({ changes: { from: 7, insert: ' ' } }).state;
    assert.equal(state.field(navigationHighlight), null);
    state = state.update({
      effects: setNavigationHighlight.of({ path: 'Other.md', from: 0, to: 3 }),
    }).state;
    assert.equal(state.field(navigationHighlight), null);
  }
});

test('Reading View limits the line highlight to the matching parent item or table cell line', () => {
  for (const [html, source] of [
    ['<main><ul><li id="target">##a<ul><li>child</li></ul></li></ul></main>', '- ##a\n  - child'],
    [
      '<main><table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td id="target">before<br>##a<br>next</td><td>other</td></tr></tbody></table></main>',
      '| A | B |\n| - | - |\n| before<br>##a<br>next | other |',
    ],
  ]) {
    const dom = createDom(html);
    const root = dom.window.document.querySelector('main');
    let current = true;
    let highlight;
    try {
      decorateReading(root, source, undefined, undefined, {
        path: 'A.md',
        offset: 100,
        isCurrent: () => current,
      });
      const marker = root.querySelector('[data-local-tags-reading]');
      const block = root.querySelector('#target');
      const from = 100 + source.indexOf('##a');
      assert.equal(readingLocation(marker).from, from);
      assert.equal(readingLocation(marker).to, from + 3);
      block.style.lineHeight = '20px';
      block.getBoundingClientRect = () => ({ top: 20, height: 100 });
      marker.getClientRects = () => [{ top: 30, bottom: 42, width: 20, height: 12 }];
      highlight = new RenderedNavigationHighlight(
        root,
        { path: 'A.md', from, to: from + 3 },
        () => current,
      );
      assert.deepEqual([...root.querySelectorAll('.local-tags-current-match')], [marker]);
      assert.deepEqual([...root.querySelectorAll('.local-tags-current-line')], [block]);
      assert.equal(block.style.getPropertyValue('--local-tags-match-top'), '6px');
      assert.equal(block.style.getPropertyValue('--local-tags-match-bottom'), '26px');
      current = false;
      highlight.refresh();
      assert.equal(root.querySelector('.local-tags-current-match,.local-tags-current-line'), null);
      assert.equal(block.style.getPropertyValue('--local-tags-match-top'), '');
      assert.equal(block.style.getPropertyValue('--local-tags-match-bottom'), '');
      clearReading(root);
      assert.equal(readingLocation(marker), undefined);
    } finally {
      highlight?.dispose();
      dom.window.close();
    }
  }
});

test('navigation excludes unrelated tags, code and links and skips hidden Reading View comments', () => {
  const source =
    '##a ##a/b ##ab `##a` [##a](note.md) %% ##a/comment %% ##a/visible %% ##a/unclosed';
  const matches = (reading) => navigationCandidates(source, 'a', reading).map(({ name }) => name);
  assert.deepEqual(matches(false), ['a', 'a/b', 'a/comment', 'a/visible', 'a/unclosed']);
  assert.deepEqual(matches(true), ['a', 'a/b', 'a/visible']);
});
