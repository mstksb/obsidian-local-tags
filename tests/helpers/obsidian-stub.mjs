import { StateField } from '@codemirror/state';

export const apiVersion = 'test-api';
export function addIcon() {}

export class TFile {
  constructor(path) {
    this.path = path;
    this.extension = path.endsWith('.md') ? 'md' : 'png';
    this.stat = { mtime: 1, size: 1 };
  }
}

export const editorInfoField = StateField.define({
  create: () => null,
  update: (value) => value,
});

export class FileView {
  constructor(file) {
    this.file = file;
  }
}

export class MarkdownView extends FileView {
  constructor(file, editor) {
    super(file);
    this.editor = editor;
  }
}

export class Notice {
  constructor(message) {
    this.message = message;
  }
}

export class EditorSuggest {
  constructor(app) {
    this.app = app;
    this.context = null;
  }

  close() {
    this.closed = true;
  }
}

export class ItemView {
  constructor(leaf) {
    this.app = leaf.app;
    this.contentEl = leaf.element;
    this.containerEl = leaf.element;
    this.cleanups = [];
  }

  register(cleanup) {
    this.cleanups.push(cleanup);
  }
}

export class Plugin {
  constructor(app) {
    this.app = app;
    this.manifest = { version: '0.1.0' };
    this.processors = [];
    this.commands = [];
  }

  registerView() {}
  addSettingTab(tab) {
    this.settingTab = tab;
  }
  registerEditorExtension() {}
  registerEditorSuggest() {}
  registerEvent() {}

  async loadData() {
    return this.data;
  }

  async saveData(data) {
    this.data = data;
  }

  addCommand(command) {
    this.commands.push(command);
  }

  registerMarkdownPostProcessor(processor) {
    this.processors.push(processor);
  }
}

export class PluginSettingTab {
  update() {
    this.definitions = this.getSettingDefinitions();
    this.updateCount = (this.updateCount ?? 0) + 1;
  }
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
  }
}

class Control {
  setValue(value) {
    this.value = value;
    return this;
  }
  setValueRgb(value) {
    this.rgb = value;
    return this;
  }
  setLimits(min, max, step) {
    this.limits = { min, max, step };
    return this;
  }
  setInstant(value) {
    this.instant = value;
    return this;
  }
  addOptions(options) {
    this.options = options;
    return this;
  }
  setButtonText(text) {
    this.text = text;
    return this;
  }
  onChange(callback) {
    this.change = callback;
    return this;
  }
  onClick(callback) {
    this.click = callback;
    return this;
  }
}
export class Setting {
  constructor() {
    this.controls = {};
  }
  setName(name) {
    this.name = name;
    return this;
  }
  setDesc(desc) {
    this.desc = desc;
    return this;
  }
  addDropdown(callback) {
    const control = new Control();
    this.controls.dropdown = control;
    callback(control);
    return this;
  }
  addColorPicker(callback) {
    const control = new Control();
    this.controls.color = control;
    callback(control);
    return this;
  }
  addButton(callback) {
    const control = new Control();
    this.controls.button = control;
    callback(control);
    return this;
  }
  addSlider(callback) {
    const control = new Control();
    this.controls.slider = control;
    callback(control);
    return this;
  }
}
