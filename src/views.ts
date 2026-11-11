import { getLanguage, ItemView } from 'obsidian';
import type { WorkspaceLeaf } from 'obsidian';
import { config } from './config.ts';
import type { TreeNode } from './domain/index.ts';
import { buildSearchQuery, buildSearchUri } from './services/search.ts';
import type { CurrentDocumentController } from './services/controller.ts';
import { localTagsIconId } from './icons.ts';
import type { StylingFeature } from './styling/runtime.ts';

let nextTreeLabelId = 0;

export class PrivateTagView extends ItemView {
  private displayedPath: string | null = null;
  private list: HTMLUListElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private emptyMessage: HTMLDivElement | null = null;
  private searchName = true;
  private searchSummary = true;
  private readonly rows = new Map<
    string,
    {
      item: HTMLLIElement;
      anchor: HTMLAnchorElement;
      children: HTMLUListElement | null;
    }
  >();
  constructor(
    leaf: WorkspaceLeaf,
    private readonly controller: CurrentDocumentController,
    private readonly navigate: (tag: string, path: string) => void,
    private readonly styling?: StylingFeature,
  ) {
    super(leaf);
  }
  getViewType(): string {
    return config.treeViewType;
  }
  getDisplayText(): string {
    return 'Local tags';
  }
  getIcon(): string {
    return localTagsIconId;
  }
  onOpen(): Promise<void> {
    this.register(this.controller.subscribe(() => this.draw()));
    const unsubscribe = this.styling?.subscribeSynopses(() => this.draw());
    if (unsubscribe) this.register(unsubscribe);
    this.draw();
    const detach = this.styling?.mountPanel(this.containerEl, this.controller);
    if (detach) this.register(detach);
    return Promise.resolve();
  }

  draw(): void {
    const path = this.controller.index.path;
    if (path !== this.displayedPath) {
      this.list?.replaceChildren();
      this.rows.clear();
      this.displayedPath = path;
    }
    const document = this.contentEl.ownerDocument;
    const ownerWindow = document.defaultView;
    if (!ownerWindow) return;
    const makeList = (): HTMLUListElement => {
      const list = ownerWindow.createEl('ul');
      list.className = 'local-tags-tree-list';
      return list;
    };
    if (!this.list) {
      const japanese = getLanguage() === 'ja';
      const search = ownerWindow.createDiv();
      search.className = 'local-tags-tree-search';
      this.searchInput = ownerWindow.createEl('input');
      this.searchInput.type = 'search';
      this.searchInput.placeholder = japanese ? 'タグを検索' : 'Search tags';
      this.searchInput.setAttribute('aria-label', this.searchInput.placeholder);
      this.searchInput.addEventListener('input', () => this.draw());
      const targets = ownerWindow.createDiv();
      targets.className = 'local-tags-tree-search-targets';
      for (const [name, text] of [
        ['name', japanese ? 'タグ名' : 'Tag name'],
        ['summary', japanese ? '概要' : 'Summary'],
      ] as const) {
        const label = ownerWindow.createEl('label');
        const checkbox = ownerWindow.createEl('input');
        checkbox.type = 'checkbox';
        checkbox.name = name;
        checkbox.checked = true;
        checkbox.addEventListener('change', () => {
          if (name === 'name') this.searchName = checkbox.checked;
          else this.searchSummary = checkbox.checked;
          this.draw();
        });
        label.append(checkbox, text);
        targets.append(label);
      }
      search.append(this.searchInput, targets);
      const help = ownerWindow.createDiv();
      help.className = 'local-tags-panel-help';
      help.textContent = 'Click to search, Shift+click for the next occurrence';
      this.list = makeList();
      this.emptyMessage = ownerWindow.createDiv();
      this.emptyMessage.className = 'local-tags-tree-empty';
      this.emptyMessage.setAttribute('role', 'status');
      this.emptyMessage.textContent = japanese ? '一致するタグがありません' : 'No matching tags';
      this.emptyMessage.hidden = true;
      this.contentEl.append(search, help, this.list, this.emptyMessage);
    }
    if (!path) {
      if (this.emptyMessage) this.emptyMessage.hidden = true;
      return;
    }
    const query = this.searchInput?.value.trim().toLowerCase() ?? '';
    const filterNodes = (nodes: TreeNode[]): TreeNode[] =>
      nodes.flatMap((node) => {
        const children = filterNodes(node.children);
        const synopsis = this.controller.file
          ? this.styling?.synopsis(this.controller.file, node.path)
          : undefined;
        const matches =
          (this.searchName && node.path.toLowerCase().includes(query)) ||
          (this.searchSummary && !!synopsis?.toLowerCase().includes(query));
        return matches || children.length ? [{ ...node, children }] : [];
      });
    const tree = this.controller.index.tree();
    const visible = query ? filterNodes(tree) : tree;
    if (this.emptyMessage) this.emptyMessage.hidden = !query || visible.length > 0;
    const visited = new Set<string>();
    const drawNodes = (nodes: TreeNode[], list: HTMLUListElement): void => {
      let previous: HTMLLIElement | null = null;
      for (const node of nodes) {
        visited.add(node.path);
        let row = this.rows.get(node.path);
        if (!row) {
          const item = ownerWindow.createEl('li');
          const anchor = ownerWindow.createEl('a');
          anchor.className = 'local-tags-tree-link';
          anchor.dataset.localTag = node.path;
          anchor.textContent = node.name;
          const label = ownerWindow.createSpan();
          label.id = `local-tags-tree-label-${++nextTreeLabelId}`;
          label.hidden = true;
          label.textContent = node.path;
          anchor.setAttribute('aria-labelledby', label.id);
          const query = buildSearchQuery(path, `##${node.path}`);
          anchor.href = buildSearchUri(this.app.vault.getName(), query);
          anchor.addEventListener('click', (event) => {
            if (this.controller.index.path !== path) {
              event.preventDefault();
              this.draw();
              return;
            }
            this.controller.commitCurrent();
            if (
              event.button === 0 &&
              event.shiftKey &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey
            ) {
              event.preventDefault();
              this.navigate(node.path, path);
            }
          });
          item.append(anchor, label);
          row = { item, anchor, children: null };
          this.rows.set(node.path, row);
        }
        const next: Element | null = previous
          ? previous.nextElementSibling
          : list.firstElementChild;
        if (next !== row.item) list.insertBefore(row.item, next);
        previous = row.item;
        if (node.children.length) {
          if (!row.children) {
            row.children = makeList();
            row.item.append(row.children);
          }
          drawNodes(node.children, row.children);
        } else {
          row.children?.remove();
          row.children = null;
        }
      }
    };
    drawNodes(visible, this.list);
    for (const [name, row] of this.rows)
      if (!visited.has(name)) {
        row.item.remove();
        this.rows.delete(name);
      }
  }
}
