import { styleKeys, validColor, validStyleValue } from './types.ts';
import type { TagStyle } from './types.ts';

function normalized(style: TagStyle): TagStyle {
  const result: TagStyle = {};
  for (const key of styleKeys) {
    if (!Object.hasOwn(style, key)) continue;
    const value = style[key];
    if (validStyleValue(key, value)) result[key] = value.toLowerCase();
  }
  return result;
}

/** Resolve ancestors in order, resetting invalid definitions to the basic appearance. */
export function resolveStyle(
  name: string,
  definitions: Map<string, TagStyle>,
  fallbackTags: Set<string> = new Set(),
  basicStyle: TagStyle = {},
): TagStyle {
  let result: TagStyle = normalized(basicStyle);
  const components = name.split('/');
  for (let depth = 1; depth <= components.length; depth++) {
    const ancestor = components.slice(0, depth).join('/');
    const style = definitions.get(ancestor);
    if (style) Object.assign(result, normalized(style));
    if (fallbackTags.has(ancestor)) result = normalized(basicStyle);
  }
  return result;
}

/** Map validated style values to the static stylesheet's element-local properties. */
export function styleProperties(style: TagStyle): Record<string, string> {
  const values = normalized(style);
  return {
    '--local-tags-style-color': values['text-color'] ?? 'var(--local-tags-color, var(--tag-color))',
    '--local-tags-style-background':
      values['background-color'] ?? 'var(--local-tags-background, var(--tag-background))',
    '--local-tags-style-border': values['border-color']
      ? `1px solid ${values['border-color']}`
      : 'var(--tag-border-width, 0) solid var(--tag-border-color)',
    '--local-tags-style-weight':
      values.bold === 'on'
        ? '700'
        : values.bold === 'off'
          ? '400'
          : 'var(--local-tags-weight, var(--tag-weight, inherit))',
    '--local-tags-style-font-style':
      values.italic === 'on'
        ? 'italic'
        : values.italic === 'off'
          ? 'normal'
          : 'var(--local-tags-style, inherit)',
    '--local-tags-style-decoration':
      values.underline === 'on'
        ? 'underline'
        : values.underline === 'off'
          ? 'none'
          : 'var(--local-tags-decoration, var(--tag-decoration, none))',
  };
}

function luminance(color: string): number {
  if (!validColor(color)) throw new RangeError('Expected a six-digit hexadecimal color');
  const channels = [1, 3, 5].map((position) => {
    const component = Number.parseInt(color.slice(position, position + 2), 16) / 255;
    return component <= 0.04045 ? component / 12.92 : ((component + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

/** WCAG 2.2 relative luminance and contrast ratio for opaque sRGB hex colors. */
export function contrastRatio(a: string, b: string): number {
  const left = luminance(a);
  const right = luminance(b);
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}
