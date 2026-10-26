import { JSDOM } from 'jsdom';

/** Provide the Obsidian DOM helpers used by the plugin in isolated DOM tests. */
export function createDom(html) {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  Object.defineProperty(document, 'win', { value: dom.window });
  dom.window.createEl = (tag, options = {}) => {
    const element = document.createElement(tag);
    if (options.text !== undefined) element.textContent = options.text;
    if (options.cls)
      element.className = Array.isArray(options.cls) ? options.cls.join(' ') : options.cls;
    for (const [name, value] of Object.entries(options.attr ?? {}))
      element.setAttribute(name, value);
    return element;
  };
  dom.window.createSpan = (options) => dom.window.createEl('span', options);
  dom.window.createFragment = () => document.createDocumentFragment();
  dom.window.HTMLElement.prototype.createEl = function (tag, options) {
    const element = dom.window.createEl(tag, options);
    this.append(element);
    return element;
  };
  dom.window.HTMLElement.prototype.createSpan = function (options) {
    return this.createEl('span', options);
  };
  dom.window.HTMLElement.prototype.setCssProps = function (props) {
    for (const [name, value] of Object.entries(props)) {
      if (value === '') this.style.removeProperty(name);
      else this.style.setProperty(name, value);
    }
  };
  return dom;
}
