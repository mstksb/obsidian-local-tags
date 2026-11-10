import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom } from './helpers/dom.mjs';
import { fixture, app, file } from './helpers/bundle.mjs';

const { CurrentDocumentController, PrivateTagSuggest, PrivateTagView, LocalTagsPlugin } = fixture;

async function descriptionFixture() {
  const dom = createDom('<main></main>');
  const { document } = dom.window;
  const source =
    '# local-tags-config\n- ##tag1 First description\n' +
    '- ##tag2 <b>Literal</b> **description**\n\n# Notes\n##tag1 ##tag1/child ##tag2\n';
  const notes = new Map();
  for (const [path, text] of [
    ['A.md', source],
    ['B.md', source.replace('First', 'Other')],
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
  const plugin = new LocalTagsPlugin(host);
  let suggest;
  plugin.registerEditorSuggest = (value) => (suggest = value);
  plugin.onload();
  await plugin.settingsLoad;
  for (const note of notes.values()) await plugin.styling.reload(note.file);
  const timers = new Map();
  const setTimeout = dom.window.setTimeout.bind(dom.window);
  const clearTimeout = dom.window.clearTimeout.bind(dom.window);
  let nextTimer = -1;
  dom.window.setTimeout = (callback, delay, ...args) => {
    if (delay !== 250) return setTimeout(callback, delay, ...args);
    timers.set(nextTimer, callback);
    return nextTimer--;
  };
  dom.window.clearTimeout = (timer) => {
    if (timers.has(timer)) timers.delete(timer);
    else clearTimeout(timer);
  };
  const panels = [];
  return {
    dom,
    notes,
    plugin,
    suggest,
    timers,
    tooltip: () => document.querySelector('[data-local-tag-tooltip]'),
    panel(target) {
      const root = document.createElement('section');
      root.append(document.createElement('div'));
      root.firstChild.className = 'view-content';
      document.querySelector('main').append(root);
      panels.push(
        plugin.styling.mountPanel(root, {
          file: target,
          currentView: null,
          subscribe: () => () => {},
          commitCurrent() {},
        }),
      );
      return root;
    },
    tag(root, name, link = false) {
      const tag = document.createElement(link ? 'a' : 'span');
      tag.className = link ? 'local-tags-tree-link' : 'local-tags-tag';
      tag.dataset.localTag = name;
      tag.textContent = `##${name}`;
      if (link) tag.href = '#search';
      root.append(tag);
      return tag;
    },
    hover(target) {
      target.dispatchEvent(new dom.window.MouseEvent('mouseover', { bubbles: true }));
    },
    advance() {
      for (const [timer, callback] of [...timers]) {
        timers.delete(timer);
        callback();
      }
    },
    close() {
      for (const detach of panels) detach();
      plugin.onunload();
      dom.window.close();
    },
  };
}

test('registered completion shows exact-file descriptions safely and inserts only the tag', async () => {
  const h = await descriptionFixture();
  try {
    const a = h.notes.get('A.md');
    const b = h.notes.get('B.md');
    await h.plugin.controller.activate(a.file, a.view.editor);
    let inserted;
    h.suggest.context = {
      file: a.file,
      query: 'tag',
      start: { line: 0, ch: 0 },
      end: { line: 0, ch: 5 },
      editor: {
        replaceRange: (value) => (inserted = value),
        setCursor: (value) => assert.deepEqual(value, { line: 0, ch: 7 }),
      },
    };
    const names = h.suggest.getSuggestions(h.suggest.context);
    assert.deepEqual(names, ['tag1', 'tag1/child', 'tag2']);
    const rows = names.map((name, index) => {
      const row = h.dom.window.document.createElement('div');
      row.classList.toggle('is-selected', index === 0);
      h.suggest.renderSuggestion(name, row);
      return row;
    });
    assert.deepEqual(
      rows.map((row) => row.querySelector('.local-tags-suggestion-synopsis')?.textContent),
      ['First description', undefined, '<b>Literal</b> **description**'],
    );
    assert.equal(rows[2].querySelector('b'), null);
    h.suggest.selectSuggestion('tag2', { key: 'Enter' });
    assert.equal(inserted, '##tag2 ');
    const row = rows[0];
    await h.plugin.controller.activate(b.file, b.view.editor);
    h.suggest.renderSuggestion('tag1', row);
    assert.equal(row.textContent, '##tag1');
    assert.equal(row.classList.contains('local-tags-suggestion'), false);
    assert.equal(row.classList.contains('is-selected'), true);
    h.suggest.context.file = b.file;
    h.suggest.renderSuggestion('tag1', row);
    assert.equal(
      row.querySelector('.local-tags-suggestion-synopsis').textContent,
      'Other description',
    );
    b.source = b.source.replace(' Other description', '');
    await h.plugin.styling.reload(b.file);
    h.suggest.renderSuggestion('tag1', row);
    assert.equal(row.textContent, '##tag1');
    assert.equal(row.querySelector('.local-tags-suggestion-synopsis'), null);
  } finally {
    h.close();
  }
});

test('body and panel descriptions isolate files, update literal text, and release tooltips', async () => {
  const h = await descriptionFixture();
  try {
    const a = h.notes.get('A.md');
    const b = h.notes.get('B.md');
    const first = h.tag(h.panel(a.file), 'tag1', true);
    const second = h.tag(h.panel(b.file), 'tag1', true);
    const body = h.tag(a.view.containerEl, 'tag1');
    const child = h.tag(a.view.containerEl, 'tag1/child');
    first.focus();
    assert.equal(h.tooltip()?.textContent, 'First description');
    assert.equal(first.getAttribute('aria-describedby'), h.tooltip().id);
    second.focus();
    assert.equal(h.tooltip()?.textContent, 'Other description');
    h.hover(child);
    h.advance();
    assert.equal(h.tooltip(), null);
    h.hover(body);
    assert.equal(h.tooltip(), null);
    assert.equal(h.timers.size, 1);
    h.advance();
    assert.equal(h.tooltip()?.textContent, 'First description');
    assert.equal(body.hasAttribute('tabindex'), false);
    a.source = a.source.replace('First description', '<img src=x onerror=alert(1)>');
    await h.plugin.styling.reload(a.file);
    assert.equal(h.tooltip()?.textContent, '<img src=x onerror=alert(1)>');
    assert.equal(h.tooltip().children.length, 0);
    body.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(h.tooltip(), null);
    first.focus();
    assert.equal(h.tooltip()?.textContent, '<img src=x onerror=alert(1)>');
    a.source += '\n# local-tags-config\n- ##tag1 Ambiguous description\n';
    await h.plugin.styling.reload(a.file);
    assert.equal(h.tooltip(), null);
    assert.equal(first.hasAttribute('aria-describedby'), false);
    assert.equal(h.plugin.styling.synopsis(b.file, 'tag1'), 'Other description');
    assert.equal(first.getAttribute('href'), '#search');
    h.hover(second);
    assert.equal(h.timers.size, 1);
    h.plugin.onunload();
    h.advance();
    assert.equal(h.tooltip(), null);
    assert.equal(h.timers.size, 0);
  } finally {
    h.close();
  }
});

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

test('completion and prefix settings normalize legacy and invalid saved values', () => {
  assert.equal(fixture.normalizeSettings(null).completionMatchMode, 'substring');
  for (const value of [undefined, null, '', true, 'PREFIX', {}, []]) {
    assert.equal(
      fixture.normalizeSettings({ completionMatchMode: value }).completionMatchMode,
      'substring',
    );
  }
  for (const value of [undefined, null, false, 1, 'true', {}, []]) {
    const settings = fixture.normalizeSettings({
      completionCaseSensitive: value,
      hideTagPrefix: value,
    });
    assert.equal(settings.completionCaseSensitive, false);
    assert.equal(settings.hideTagPrefix, false);
  }
  const settings = fixture.normalizeSettings({
    completionMatchMode: 'prefix',
    completionCaseSensitive: true,
    hideTagPrefix: true,
  });
  assert.equal(settings.completionMatchMode, 'prefix');
  assert.equal(settings.completionCaseSensitive, true);
  assert.equal(settings.hideTagPrefix, true);
});

test('registered completion follows settings controls and retains saved choices after reload', async () => {
  const dom = createDom('<main></main>');
  const host = app();
  host.workspace.containerEl = dom.window.document.querySelector('main');
  const plugin = new LocalTagsPlugin(host);
  let suggest;
  plugin.registerEditorSuggest = (value) => {
    suggest = value;
  };
  plugin.onload();
  try {
    await Promise.resolve();
    await plugin.controller.activate(file('A.md'), {
      getValue: () => '##alpha ##alphabet ##beta/alpha ##Alpha',
    });
    const render = (name) => {
      const definition = plugin.settingTab
        .getSettingDefinitions()
        .find((item) => item.name === name);
      assert.ok(definition?.desc);
      const setting = new fixture.Setting();
      definition.render(setting);
      return setting.controls;
    };
    assert.deepEqual(suggest.getSuggestions({ query: 'ALPHA' }), [
      'Alpha',
      'alpha',
      'alphabet',
      'beta/alpha',
    ]);
    const matching = render('Completion matching').dropdown;
    assert.equal(matching.value, 'substring');
    assert.deepEqual(matching.options, { substring: 'Substring match', prefix: 'Prefix match' });
    await matching.change('prefix');
    assert.deepEqual(suggest.getSuggestions({ query: 'alpha' }), ['Alpha', 'alpha', 'alphabet']);
    const sensitivity = render('Case-sensitive completion').toggle;
    assert.equal(sensitivity.value, false);
    await sensitivity.change(true);
    assert.deepEqual(suggest.getSuggestions({ query: 'alpha' }), ['alpha', 'alphabet']);
    assert.deepEqual(suggest.getSuggestions({ query: 'Alpha' }), ['Alpha']);
    const prefix = render('Hide local tag prefix when not editing').toggle;
    assert.equal(prefix.value, false);
    await prefix.change(true);
    assert.equal(
      dom.window.document.body.style.getPropertyValue('--local-tags-prefix-display'),
      'none',
    );
    plugin.onunload();
    plugin.onload();
    await Promise.resolve();
    assert.equal(plugin.settings.completionMatchMode, 'prefix');
    assert.equal(plugin.settings.completionCaseSensitive, true);
    assert.equal(plugin.settings.hideTagPrefix, true);
    await plugin.controller.activate(file('A.md'), {
      getValue: () => '##alpha ##alphabet ##beta/alpha ##Alpha',
    });
    assert.deepEqual(suggest.getSuggestions({ query: 'alpha' }), ['alpha', 'alphabet']);
    await render('Completion matching').dropdown.change('substring');
    assert.deepEqual(suggest.getSuggestions({ query: 'alpha' }), [
      'alpha',
      'alphabet',
      'beta/alpha',
    ]);
    await render('Case-sensitive completion').toggle.change(false);
    assert.deepEqual(suggest.getSuggestions({ query: 'ALPHA' }), [
      'Alpha',
      'alpha',
      'alphabet',
      'beta/alpha',
    ]);
    await render('Hide local tag prefix when not editing').toggle.change(false);
    assert.equal(
      dom.window.document.body.style.getPropertyValue('--local-tags-prefix-display'),
      '',
    );
  } finally {
    plugin.onunload();
    dom.window.close();
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
    assert.equal(definitions.length, 9);
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
