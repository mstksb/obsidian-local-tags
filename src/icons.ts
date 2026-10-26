import { addIcon } from 'obsidian';
import panelIcon from '../assets/icons/local-tags-l-aligned.svg';

export const localTagsIconId = 'local-tags-panel';

export function registerLocalTagsIcon(): void {
  // Obsidian custom icons use a 100×100 canvas; keep the editable asset at 24×24.
  const content = panelIcon.replace(/<svg\b[^>]*>/, '').replace('</svg>', '');
  addIcon(localTagsIconId, `<g transform="scale(${100 / 24})">${content}</g>`);
}
