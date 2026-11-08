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
