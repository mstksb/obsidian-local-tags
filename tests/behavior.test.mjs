import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom } from './helpers/dom.mjs';
import { fixture, app, file } from './helpers/bundle.mjs';

const { CurrentDocumentController, PrivateTagSuggest, PrivateTagView, LocalTagsPlugin } = fixture;

test('file changes replace candidates while auxiliary views preserve the current document', async () => {
  const controller = new CurrentDocumentController(app(), '0.1.0');
  const editor = {
    value: '##first',
    getValue() {
      return this.value;
    },
  };
  await controller.activate(file('A.md'), editor);
  assert.deepEqual(controller.index.names(), ['first']);
  editor.value = '##second';
  await controller.activate(file('B.md'), editor);
  assert.deepEqual(controller.index.names(), ['second']);
  await controller.followLeaf({ view: { getViewType: () => 'search' } });
  assert.equal(controller.index.path, 'B.md');
  assert.deepEqual(controller.index.names(), ['second']);
  await controller.followLeaf({ view: new fixture.FileView(file('image.png')) });
  assert.deepEqual(controller.index.names(), []);
  controller.dispose();
});

test('a late read from the previous file cannot replace the active file candidates', async () => {
  const pending = new Map();
  const controller = new CurrentDocumentController(
    app((target) => new Promise((resolve) => pending.set(target.path, resolve))),
    '0.1.0',
  );
  const first = controller.activate(file('A.md'));
  const second = controller.activate(file('B.md'));
  pending.get('B.md')('##second');
  await second;
  pending.get('A.md')('##first');
  await first;
  assert.equal(controller.index.path, 'B.md');
  assert.deepEqual(controller.index.names(), ['second']);
  controller.dispose();
});

test('Enter completion replaces the complete tag and adds one space without removing existing whitespace', async () => {
  const controller = new CurrentDocumentController(app(), '0.1.0');
  const target = file('A.md');
  let text = '##aa tail';
  const editor = {
    getValue: () => text,
    replaceRange(value, start, end) {
      text = text.slice(0, start.ch) + value + text.slice(end.ch);
    },
    setCursor(position) {
      this.cursor = position;
    },
  };
  await controller.activate(target, editor);
  const suggest = new PrivateTagSuggest(controller);
  suggest.context = {
    editor,
    file: target,
    start: { line: 0, ch: 0 },
    end: { line: 0, ch: 4 },
    query: 'aa',
  };
  suggest.selectSuggestion('people/Alice', { key: 'Tab' });
  assert.equal(text, '##aa tail');
  suggest.selectSuggestion('people/Alice', { type: 'click' });
  assert.equal(text, '##aa tail');
  suggest.selectSuggestion('people/Alice', { key: 'Enter' });
  assert.equal(text, '##people/Alice  tail');
  assert.deepEqual(editor.cursor, { line: 0, ch: 15 });
  controller.dispose();
});

test('the panel displays sorted hierarchy and file-scoped search links, and rejects stale links', async () => {
  const controller = new CurrentDocumentController(app(), '0.1.0');
  const dom = createDom('<main></main>');
  const target = file('Notes/Meeting.md');
  await controller.activate(target, { getValue: () => '##people/Bob ##people/Alice ##Topic' });
  const view = new PrivateTagView(
    { app: controller.app, element: dom.window.document.querySelector('main') },
    controller,
  );
  await view.onOpen();
  const anchors = [...view.contentEl.querySelectorAll('a')];
  assert.deepEqual(
    anchors.map((node) => node.textContent),
    ['Topic', 'people', 'Alice', 'Bob'],
  );
  const uri = new URL(anchors[1].href);
  assert.equal(uri.protocol, 'obsidian:');
  assert.equal(uri.hostname, 'search');
  assert.equal(uri.searchParams.get('vault'), 'Example Vault');
  assert.equal(
    uri.searchParams.get('query'),
    'match-case:(path:/^Notes\\u002fMeeting\\u002emd$/ content:"##people")',
  );
  await controller.activate(file('Other.md'), { getValue: () => '##other' });
  const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
  anchors[1].dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(
    [...view.contentEl.querySelectorAll('a')].map((node) => node.textContent),
    ['other'],
  );
  for (const cleanup of view.cleanups) cleanup();
  controller.dispose();
  dom.window.close();
});

test('appearance variables persist across reload, reset to defaults, and are removed on unload', async () => {
  const dom = createDom('<main></main>');
  const host = app();
  const { document } = dom.window;
  const body = document.body;
  body.style.setProperty('--unrelated-property', 'preserve');
  host.workspace.containerEl = document.querySelector('main');
  let detached = 0;
  host.workspace.detachLeavesOfType = () => {
    detached++;
  };
  const plugin = new LocalTagsPlugin(host);
  plugin.onload();
  try {
    await plugin.updateSettings({
      tagVerticalPadding: -1.25,
      tagTextColor: '#123456',
      tagBackgroundColor: '#abcdef',
      tagBold: 'on',
      tagUnderline: 'on',
      tagItalic: 'off',
    });
    const values = () =>
      Object.fromEntries(
        [
          '--local-tags-padding-y-offset',
          '--local-tags-color',
          '--local-tags-background',
          '--local-tags-weight',
          '--local-tags-decoration',
          '--local-tags-style',
        ].map((key) => [key, body.style.getPropertyValue(key)]),
      );
    assert.deepEqual(values(), {
      '--local-tags-padding-y-offset': '-1.25px',
      '--local-tags-color': '#123456',
      '--local-tags-background': '#abcdef',
      '--local-tags-weight': '700',
      '--local-tags-decoration': 'underline',
      '--local-tags-style': 'normal',
    });
    assert.equal(document.head.querySelector('style'), null);
    assert.equal(plugin.data.tagTextColor, '#123456');
    plugin.onunload();
    assert.equal(detached, 0);
    assert.ok(Object.values(values()).every((value) => value === ''));
    assert.equal(body.style.getPropertyValue('--unrelated-property'), 'preserve');
    plugin.onload();
    await Promise.resolve();
    assert.equal(plugin.settings.tagTextColor, '#123456');
    assert.equal(plugin.settings.tagVerticalPadding, -1.25);
    assert.equal(body.style.getPropertyValue('--local-tags-color'), '#123456');
    await plugin.updateSettings({
      tagVerticalPadding: 0,
      tagTextColor: '',
      tagBackgroundColor: '',
      tagBold: 'default',
      tagUnderline: 'default',
      tagItalic: 'default',
    });
    assert.deepEqual(values(), {
      '--local-tags-padding-y-offset': '0px',
      '--local-tags-color': '',
      '--local-tags-background': '',
      '--local-tags-weight': '',
      '--local-tags-decoration': '',
      '--local-tags-style': '',
    });
  } finally {
    plugin.onunload();
    assert.equal(detached, 0);
    assert.equal(body.style.getPropertyValue('--unrelated-property'), 'preserve');
    dom.window.close();
  }
});

test('appearance updates clean the previous document without changing unrelated properties', async () => {
  const first = createDom('<main></main>');
  const second = createDom('<main></main>');
  const host = app();
  host.workspace.containerEl = first.window.document.querySelector('main');
  const plugin = new LocalTagsPlugin(host);
  plugin.onload();
  try {
    await plugin.updateSettings({ tagTextColor: '#123456' });
    host.workspace.containerEl = second.window.document.querySelector('main');
    await plugin.updateSettings({ tagTextColor: '#abcdef' });
    assert.equal(first.window.document.body.style.getPropertyValue('--local-tags-color'), '');
    assert.equal(
      second.window.document.body.style.getPropertyValue('--local-tags-color'),
      '#abcdef',
    );
  } finally {
    plugin.onunload();
    assert.equal(second.window.document.body.style.getPropertyValue('--local-tags-color'), '');
    first.window.close();
    second.window.close();
  }
});

test('searchable appearance controls keep their settings and color reset refreshes the definitions', async () => {
  const dom = createDom('<main></main>');
  const host = app();
  host.workspace.containerEl = dom.window.document.querySelector('main');
  const plugin = new LocalTagsPlugin(host);
  plugin.onload();
  try {
    await plugin.updateSettings({ tagTextColor: '#123456', tagBackgroundColor: '#abcdef' });
    const tab = plugin.settingTab;
    tab.containerEl = dom.window.document.querySelector('main');
    const definitions = tab.getSettingDefinitions();
    assert.equal(definitions.length, 6);
    assert.ok(definitions.every((definition) => definition.name && definition.desc));
    const render = (name) => {
      const definition = tab.getSettingDefinitions().find((item) => item.name === name);
      assert.ok(definition);
      const setting = new fixture.Setting();
      definition.render(setting);
      return setting;
    };
    const bold = render('Local tag bold').controls.dropdown;
    assert.equal(bold.value, 'default');
    await bold.change('on');
    assert.equal(plugin.data.tagBold, 'on');
    const slider = render('Local tag vertical padding').controls.slider;
    assert.deepEqual(slider.limits, { min: -5, max: 5, step: 0.25 });
    await slider.change(-1.25);
    assert.equal(plugin.data.tagVerticalPadding, -1.25);
    const textColor = render('Local tag text color');
    assert.equal(textColor.controls.color.value, '#123456');
    await textColor.controls.color.change('#654321');
    assert.equal(plugin.data.tagTextColor, '#654321');
    await textColor.controls.button.click();
    assert.equal(plugin.data.tagTextColor, '');
    assert.equal(dom.window.document.body.style.getPropertyValue('--local-tags-color'), '');
    assert.equal(tab.updateCount, 1);
    assert.match(
      tab.definitions.find((definition) => definition.name === 'Local tag text color').desc,
      /Using the theme color/,
    );
    const themeColor = render('Local tag text color').controls.color;
    assert.ok(themeColor.rgb);
  } finally {
    plugin.onunload();
    dom.window.close();
  }
});
