import { parse } from './parser.ts';
import type { Candidate } from './parser.ts';

export interface NavigationTarget {
  pane: object;
  file: object;
  path: string;
  source: string;
  tag: string;
  mode: string;
}

export interface NavigationMatch {
  candidate: Candidate;
  index: number;
  total: number;
}

export function navigationCandidates(source: string, tag: string, reading: boolean): Candidate[] {
  // Match the Reading renderer's comment handling, including unclosed comments.
  const comments = reading
    ? [...source.matchAll(/%%[\s\S]*?(?:%%|$)/g)].map((match) => ({
        from: match.index,
        to: match.index + match[0].length,
      }))
    : [];
  return parse(source).filter(
    (candidate) =>
      candidate.kind === 'valid' &&
      (candidate.name === tag || candidate.name.startsWith(`${tag}/`)) &&
      !comments.some((comment) => candidate.from >= comment.from && candidate.from < comment.to),
  );
}

function sameTarget(a: NavigationTarget, b: NavigationTarget): boolean {
  return (
    a.pane === b.pane &&
    a.file === b.file &&
    a.path === b.path &&
    a.source === b.source &&
    a.tag === b.tag &&
    a.mode === b.mode
  );
}

/** Preparing a move must not consume an occurrence when rendering fails. */
export class NavigationCycle {
  private previous?: NavigationTarget;
  private index = -1;

  prepare(target: NavigationTarget, candidates: readonly Candidate[]): NavigationMatch | null {
    if (!candidates.length) return null;
    const continuing = this.previous && sameTarget(this.previous, target);
    const index = continuing ? (this.index + 1) % candidates.length : 0;
    return { candidate: candidates[index]!, index, total: candidates.length };
  }

  commit(target: NavigationTarget, match: NavigationMatch): void {
    this.previous = { ...target };
    this.index = match.index;
  }

  reset(): void {
    this.previous = undefined;
    this.index = -1;
  }
}
