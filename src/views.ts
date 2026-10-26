import { ItemView } from 'obsidian';
import type { WorkspaceLeaf } from 'obsidian';
import { config } from './config.ts';
import type { TreeNode } from './domain/index.ts';
import { buildSearchQuery, buildSearchUri } from './services/search.ts';
import type { CurrentDocumentController } from './services/controller.ts';
import { localTagsIconId } from './icons.ts';

export class PrivateTagView extends ItemView {
  private displayedPath: string | null = null;
  private list: HTMLUListElement | null = null;
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
    this.draw();
    return Promise.resolve();
  }

  draw(): void {
    const path = this.controller.index.path;
    if (path !== this.displayedPath) {
      this.contentEl.replaceChildren();
      this.rows.clear();
      this.list = null;
      this.displayedPath = path;
    }
    if (!path) return;
    const document = this.contentEl.ownerDocument;
    const ownerWindow = document.defaultView;
    if (!ownerWindow) return;
    const makeList = (): HTMLUListElement => {
      const list = ownerWindow.createEl('ul');
      list.className = 'local-tags-tree-list';
      return list;
    };
    if (!this.list) {
      this.list = makeList();
      this.contentEl.append(this.list);
    }
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
          anchor.textContent = node.name;
          const query = buildSearchQuery(path, `##${node.path}`);
          anchor.href = buildSearchUri(this.app.vault.getName(), query);
          anchor.addEventListener('click', (event) => {
            if (this.controller.index.path !== path) {
              event.preventDefault();
              this.draw();
              return;
            }
            this.controller.commitCurrent();
          });
          item.append(anchor);
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
    drawNodes(this.controller.index.tree(), this.list);
    for (const [name, row] of this.rows)
      if (!visited.has(name)) {
        row.item.remove();
        this.rows.delete(name);
      }
  }
}
