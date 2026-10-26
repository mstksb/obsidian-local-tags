import type { Candidate } from './parser.ts';

export interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
}
export function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export class PrivateTagIndex {
  path: string | null = null;
  occurrences: readonly Candidate[] = [];

  replace(path: string | null, occurrences: readonly Candidate[]): void {
    this.path = path;
    this.occurrences = path ? occurrences.filter((candidate) => candidate.kind === 'valid') : [];
  }

  names(): string[] {
    return [...new Set(this.occurrences.map((item) => item.name))].sort(compare);
  }

  suggest(query: string, limit = 10): string[] {
    const rank = (name: string): number => (name === query ? 0 : name.startsWith(query) ? 1 : 2);
    return this.names()
      .filter((name) => name.includes(query))
      .sort((a, b) => rank(a) - rank(b) || compare(a, b))
      .slice(0, limit);
  }

  tree(): TreeNode[] {
    const roots: TreeNode[] = [];
    for (const name of this.names()) {
      let siblings = roots;
      let path = '';
      for (const part of name.split('/')) {
        path = path ? `${path}/${part}` : part;
        let node = siblings.find((item) => item.name === part);
        if (!node) {
          node = { name: part, path, children: [] };
          siblings.push(node);
        }
        siblings = node.children;
      }
    }
    function sort(nodes: TreeNode[]): TreeNode[] {
      nodes.sort((a, b) => compare(a.name, b.name));
      nodes.forEach((node) => sort(node.children));
      return nodes;
    }
    return sort(roots);
  }
}
