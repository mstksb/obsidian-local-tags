/** Escape exact paths and case-sensitive tag strings for standard search. */
export function buildSearchQuery(path: string, tag: string): string {
  const escaped = path.replace(
    /[.*+?^${}()|[\]\\/"\s#]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
  const quotedTag = `"${tag.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  return `match-case:(path:/^${escaped}$/ content:${quotedTag})`;
}

export function buildSearchUri(vault: string, query: string): string {
  return `obsidian://search?vault=${encodeURIComponent(vault)}&query=${encodeURIComponent(query)}`;
}
