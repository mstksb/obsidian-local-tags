export const styleKeys = [
  'text-color',
  'background-color',
  'border-color',
  'bold',
  'italic',
  'underline',
] as const;

export type StyleKey = (typeof styleKeys)[number];
export type ColorKey = Extract<StyleKey, `${string}-color`>;
export type TagStyle = Partial<Record<StyleKey, string>>;

const colorKeys = new Set<StyleKey>(['text-color', 'background-color', 'border-color']);

export const isColorKey = (key: StyleKey): key is ColorKey => colorKeys.has(key);
export const validColor = (value: string): boolean => /^#[0-9a-f]{6}$/iu.test(value);

export function validStyleValue(key: StyleKey, value: unknown): value is string {
  return (
    typeof value === 'string' &&
    (isColorKey(key) ? validColor(value) : value === 'on' || value === 'off')
  );
}

export interface RandomOptions {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export type PalettePattern = 'vivid';
export type ColorHarmony = 'complementary';
export interface PaletteOptions {
  pattern: PalettePattern;
  harmony: ColorHarmony;
}

export interface SourceRange {
  from: number;
  to: number;
}

export interface SettingsLayout {
  section: SourceRange & { heading: SourceRange };
  tags: Array<
    SourceRange & {
      name: string;
      colors: Array<SourceRange & { key: ColorKey; value: string }>;
    }
  >;
}

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  tag?: string;
  line?: number;
  message: string;
}

export interface Definitions {
  definitions: Map<string, TagStyle>;
  synopses: Map<string, string>;
  invalidTags: Set<string>;
  diagnostics: Diagnostic[];
  ambiguous: boolean;
}

export type Operation =
  | { kind: 'ensure' }
  | { kind: 'remove-empty' }
  | { kind: 'sort' }
  | {
      kind: 'random';
      onlyUnset: boolean;
      options?: RandomOptions;
      palette?: PaletteOptions;
    }
  | {
      kind: 'random-tag';
      tag: string;
      expectedSource: string;
      options?: RandomOptions;
      palette?: PaletteOptions;
    }
  | {
      kind: 'color';
      tag: string;
      key: ColorKey;
      value: string;
      expectedSource: string;
    };
