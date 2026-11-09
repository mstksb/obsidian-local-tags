import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom } from './helpers/dom.mjs';
import { fixture, app } from './helpers/bundle.mjs';

const { decorateReading, clearReading } = fixture;

test('ordinary caret movement reuses tag state while tag contact updates prefix visibility', () => {
  const {
    CurrentDocumentController,
    EditorState,
    EditorView,
    documentField,
    editorExtension,
    editorLivePreviewField,
  } = fixture;
  const controller = new CurrentDocumentController(app(), '0.4.1');
  const source = '##alpha body text';
  let state = EditorState.create({
    doc: source,
    selection: { anchor: source.length },
    extensions: [
      editorExtension(controller, undefined, () => true),
      editorLivePreviewField.init(() => true),
    ],
  });
  const model = state.field(documentField);
  const decorations = state.facet(EditorView.decorations)[0];
  assert.equal(decorations.size, 2);
  state = state.update({ selection: { anchor: source.length - 1 } }).state;
  assert.equal(state.field(documentField), model);
  assert.equal(state.facet(EditorView.decorations)[0], decorations);
  state = state.update({ selection: { anchor: 3 } }).state;
  assert.equal(state.field(documentField), model);
  assert.notEqual(state.facet(EditorView.decorations)[0], decorations);
  assert.equal(state.facet(EditorView.decorations)[0].size, 1);
  assert.equal(state.doc.toString(), source);
  controller.dispose();
});

test('leaving an edited tag still commits its name and restores decoration', () => {
  const {
    CurrentDocumentController,
    EditorState,
    EditorView,
    documentField,
    editorExtension,
    editorLivePreviewField,
  } = fixture;
  const controller = new CurrentDocumentController(app(), '0.4.1');
  let state = EditorState.create({
    doc: '##alpha body text',
    selection: { anchor: 7 },
    extensions: [
      editorExtension(controller, undefined, () => true),
      editorLivePreviewField.init(() => true),
    ],
  });
  state = state.update({ changes: { from: 7, insert: 'x' }, selection: { anchor: 8 } }).state;
  const editing = state.field(documentField);
  assert.equal(editing.pending.length, 1);
  assert.deepEqual(
    editing.committed.map((tag) => tag.name),
    ['alpha'],
  );
  state = state.update({ selection: { anchor: state.doc.length } }).state;
  assert.notEqual(state.field(documentField), editing);
  assert.deepEqual(state.field(documentField).pending, []);
  assert.deepEqual(
    state.field(documentField).committed.map((tag) => tag.name),
    ['alphax'],
  );
  assert.equal(state.facet(EditorView.decorations)[0].size, 2);
  assert.equal(state.doc.toString(), '##alphax body text');
  controller.dispose();
});

test('rendering decorates visible tags and errors without changing text or links', () => {
  const dom = createDom(
    '<main><p>##people ##people/ <code>##code</code> <a href="#">##link</a> after ##visible</p></main>',
  );
  const root = dom.window.document.querySelector('main');
  const before = root.textContent;
  decorateReading(root, '##people ##people/ `##code` [##link](#) after ##visible');
  assert.deepEqual(
    [...root.querySelectorAll('.local-tags-tag')].map((node) => node.textContent),
    ['##people', '##visible'],
  );
  assert.equal(root.querySelector('.local-tags-error').textContent, '##people/');
  assert.equal(root.querySelectorAll('code span, a span').length, 0);
  assert.equal(root.textContent, before);
  const comments = dom.window.document.createElement('p');
  comments.textContent = 'before  after ##visible';
  decorateReading(comments, 'before %% ##hidden %% after ##visible');
  assert.deepEqual(
    [...comments.querySelectorAll('.local-tags-tag')].map((node) => node.textContent),
    ['##visible'],
  );
  dom.window.close();
});

test('Reading View highlights support mark roots and deeply nested marks', () => {
  for (const html of [
    '<mark id="highlight-root">##highlight</mark>',
    '<main id="highlight-root"><p><span><mark>##highlight</mark></span></p></main>',
  ]) {
    const dom = createDom(html);
    const root = dom.window.document.querySelector('#highlight-root');
    decorateReading(root, '==##highlight==');
    assert.equal(root.querySelector('.local-tags-tag').textContent, '##highlight');
    assert.equal(root.textContent, '##highlight');
    dom.window.close();
  }
});

test('repeated rendering preserves visible tag text and cleanup removes decoration', () => {
  const dom = createDom('<main><p>before ##pe<span>ople/Alice</span> after</p></main>');
  const root = dom.window.document.querySelector('main');
  const source = 'before ##people/Alice after';
  decorateReading(root, source);
  const markedText = () =>
    [...root.querySelectorAll('.local-tags-tag')].map((node) => node.textContent).join('');
  assert.equal(markedText(), '##people/Alice');
  decorateReading(root, source);
  assert.equal(markedText(), '##people/Alice');
  assert.equal(root.querySelectorAll('.local-tags-tag .local-tags-tag').length, 0);
  assert.equal(root.textContent, source);
  clearReading(root);
  assert.equal(root.querySelectorAll('[data-local-tags-reading]').length, 0);
  assert.equal(root.textContent, source);
  dom.window.close();
});

test('editor state decorates normal and invalid tags once while keeping numeric text plain', () => {
  const { CurrentDocumentController, EditorState, EditorView, editorExtension } = fixture;
  const controller = new CurrentDocumentController(app(), '0.1.0');
  const state = EditorState.create({
    doc: '##tag ##bad/ ##123',
    extensions: editorExtension(controller),
  });
  const marks = [];
  for (const decorations of state.facet(EditorView.decorations)) {
    decorations.between(0, state.doc.length, (from, to, value) => {
      marks.push([state.doc.sliceString(from, to), value.spec.class]);
    });
  }
  assert.deepEqual(marks, [
    ['##tag', 'local-tags-tag'],
    ['##bad/', 'local-tags-error'],
  ]);
  controller.dispose();
});

test('prefix hiding keeps source text intact and applies only to inactive Live Preview tags', () => {
  const {
    CurrentDocumentController,
    EditorState,
    EditorView,
    editorExtension,
    editorLivePreviewField,
    refreshTagDisplay,
  } = fixture;
  const controller = new CurrentDocumentController(app(), '0.2.0');
  const source = '##alpha ##beta end';
  let hidden = true;
  const replacements = (state) => {
    const ranges = [];
    for (const decorations of state.facet(EditorView.decorations)) {
      decorations.between(0, state.doc.length, (from, to, value) => {
        if (!value.spec.class) ranges.push([from, to]);
      });
    }
    return ranges;
  };
  let state = EditorState.create({
    doc: source,
    selection: { anchor: source.length },
    extensions: [
      editorExtension(controller, undefined, () => hidden),
      editorLivePreviewField.init(() => true),
    ],
  });
  assert.deepEqual(replacements(state), [
    [0, 2],
    [8, 10],
  ]);
  state = state.update({ selection: { anchor: 3 } }).state;
  assert.deepEqual(replacements(state), [[8, 10]]);
  hidden = false;
  state = state.update({ effects: refreshTagDisplay.of(null) }).state;
  assert.deepEqual(replacements(state), []);
  assert.equal(state.doc.toString(), source);
  hidden = true;
  const sourceMode = EditorState.create({
    doc: source,
    extensions: editorExtension(controller, undefined, () => hidden),
  });
  assert.deepEqual(replacements(sourceMode), []);
  const dom = createDom('<main>##alpha ##bad/</main>');
  const root = dom.window.document.querySelector('main');
  decorateReading(root, '##alpha ##bad/');
  assert.equal(root.querySelector('.local-tags-prefix').textContent, '##');
  assert.equal(root.querySelector('.local-tags-error .local-tags-prefix'), null);
  assert.equal(root.textContent, '##alpha ##bad/');
  clearReading(root);
  assert.equal(root.querySelector('.local-tags-prefix'), null);
  assert.equal(root.textContent, '##alpha ##bad/');
  dom.window.close();
  controller.dispose();
});

test('Wiki links preserve their nodes and labels while surrounding tags are decorated', () => {
  const dom = createDom(
    '<main><p>##before <a class="internal-link" data-href="guide/Topic">##label</a> ##after</p></main>',
  );
  const root = dom.window.document.querySelector('main');
  const link = root.querySelector('a');
  const label = link.firstChild;
  const before = root.textContent;
  const source = '##before [[guide/Topic|##label]] ##after';
  for (let repeat = 0; repeat < 2; repeat++) {
    decorateReading(root, source);
    assert.deepEqual(
      [...root.querySelectorAll('.local-tags-tag')].map((node) => node.textContent).filter(Boolean),
      ['##before', '##after'],
    );
    assert.equal(root.querySelector('a'), link);
    assert.equal(link.firstChild, label);
    assert.equal(link.querySelector('.local-tags-tag'), null);
    assert.equal(root.textContent, before);
  }
  dom.window.close();
});

test('Wiki embeds preserve already decorated child content when their parent is rendered', () => {
  const dom = createDom(
    '<main><div>##before <div class="internal-embed" src="child"><div class="markdown-embed"><p>##inside</p></div></div> ##after</div></main>',
  );
  const root = dom.window.document.querySelector('main');
  const embed = root.querySelector('.internal-embed');
  const child = embed.querySelector('p');
  decorateReading(child, '##inside');
  const childMark = child.querySelector('.local-tags-tag');
  assert.ok(childMark);
  const before = root.textContent;
  decorateReading(root, '##before ![[child]] ##after');
  assert.equal(root.querySelector('.internal-embed'), embed);
  assert.equal(child.querySelector('.local-tags-tag'), childMark);
  assert.deepEqual(
    [...root.querySelectorAll('.local-tags-tag')].map((node) => node.textContent),
    ['##before', '##inside', '##after'],
  );
  assert.equal(root.textContent, before);
  assert.equal(root.querySelectorAll('.local-tags-tag .local-tags-tag').length, 0);
  clearReading(root);
  assert.equal(root.querySelectorAll('[data-local-tags-reading]').length, 0);
  assert.equal(root.textContent, before);
  dom.window.close();
});
