import { contrastRatio } from './appearance.ts';
import type { PaletteOptions, RandomOptions, TagStyle } from './types.ts';

/** Quantize opaque HSL only after choosing the hue and tone. */
function color(hue: number, saturation: number, lightness: number): string {
  const amplitude = saturation * Math.min(lightness, 1 - lightness);
  return (
    '#' +
    [0, 8, 4]
      .map((offset) => {
        const channel = (offset + hue / 30) % 12;
        const component =
          lightness - amplitude * Math.max(-1, Math.min(channel - 3, 9 - channel, 1));
        return Math.round(component * 255)
          .toString(16)
          .padStart(2, '0');
      })
      .join('')
  );
}

/** Keep hue/saturation and find a readable lightness in bounded work. */
function readableColor(
  hue: number,
  saturation: number,
  lightness: number,
  against: string,
  lighten: boolean,
): string {
  const initial = color(hue, saturation, lightness);
  if (contrastRatio(initial, against) >= 7) return initial;
  const end = lighten ? 0.96 : 0.04;
  let failing = 0;
  let passing = 1;
  let candidate = color(hue, saturation, end);
  // The endpoint guarantees a readable fallback for the tone ranges below.
  // Store only passing quantized candidates, including at rounding boundaries.
  if (contrastRatio(candidate, against) < 7)
    throw new RangeError('Palette tone has no readable endpoint');
  for (let step = 0; step < 12; step++) {
    const fraction = (failing + passing) / 2;
    const next = color(hue, saturation, lightness + (end - lightness) * fraction);
    if (contrastRatio(next, against) >= 7) {
      passing = fraction;
      candidate = next;
    } else failing = fraction;
  }
  return candidate;
}

/** Generate the fixed vivid complementary palette with readable text. */
export function paletteStyles(
  count: number,
  palette: PaletteOptions = { pattern: 'vivid', harmony: 'complementary' },
  random: () => number = Math.random,
  options: RandomOptions = { bold: false, italic: false, underline: false },
): TagStyle[] {
  if (!Number.isSafeInteger(count) || count < 0)
    throw new RangeError('Palette count must be a nonnegative safe integer');
  if (palette.pattern !== 'vivid' || palette.harmony !== 'complementary')
    throw new RangeError('The palette must use vivid complementary colors');
  const unit = (): number => {
    const value = random();
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  };
  return Array.from({ length: count }, () => {
    const backgroundHue = unit() * 360;
    const foregroundHue = (backgroundHue + 180) % 360;
    const saturation = 0.75 + unit() * 0.2;
    const lightness = 0.42 + unit() * 0.16;
    let background = color(backgroundHue, saturation, lightness);
    const darkText = color(foregroundHue, 0.65, 0.1);
    const lightText = color(foregroundHue, 0.65, 0.94);
    const text =
      contrastRatio(darkText, background) >= contrastRatio(lightText, background)
        ? darkText
        : lightText;
    background = readableColor(backgroundHue, saturation, lightness, text, text === darkText);
    const result: TagStyle = {
      'text-color': text,
      'background-color': background,
      'border-color': color(foregroundHue, saturation, text === darkText ? 0.25 : 0.75),
    };
    for (const key of ['bold', 'italic', 'underline'] as const)
      if (options[key]) result[key] = unit() >= 0.5 ? 'on' : 'off';
    return result;
  });
}
