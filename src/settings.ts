import { PluginSettingTab } from 'obsidian';
import type { App, SettingDefinitionItem } from 'obsidian';
import type LocalTagsPlugin from './main.ts';

export type TagStyle = 'default' | 'on' | 'off';

export interface LocalTagsSettings {
  tagVerticalPadding: number;
  tagTextColor: string;
  tagBackgroundColor: string;
  tagBold: TagStyle;
  tagUnderline: TagStyle;
  tagItalic: TagStyle;
}

export function normalizeSettings(value: unknown): LocalTagsSettings {
  const data = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const padding = data.tagVerticalPadding;
  return {
    tagVerticalPadding:
      typeof padding === 'number' && Number.isFinite(padding)
        ? Math.max(-5, Math.min(5, Math.round(padding * 4) / 4))
        : 0,
    tagTextColor: normalizeColor(data.tagTextColor),
    tagBackgroundColor: normalizeColor(data.tagBackgroundColor),
    tagBold: normalizeStyle(data.tagBold),
    tagUnderline: normalizeStyle(data.tagUnderline),
    tagItalic: normalizeStyle(data.tagItalic),
  };
}

function normalizeColor(value: unknown): string {
  return typeof value === 'string' && value.length === 7 && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : '';
}

function normalizeStyle(value: unknown): TagStyle {
  return value === 'on' || value === 'off' ? value : 'default';
}

export class LocalTagsSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: LocalTagsPlugin,
  ) {
    super(app, plugin);
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      this.colorSetting('tagTextColor', 'Local tag text color', 'color'),
      this.colorSetting('tagBackgroundColor', 'Local tag background color', 'backgroundColor'),
      ...(
        [
          ['tagBold', 'bold'],
          ['tagUnderline', 'underline'],
          ['tagItalic', 'italic'],
        ] as const
      ).map(([key, name]): SettingDefinitionItem => ({
        name: `Local tag ${name}`,
        desc: 'Use follow default to inherit the theme and surrounding Markdown styling.',
        render: (setting) => {
          setting.addDropdown((dropdown) =>
            dropdown
              .addOptions({
                default: 'Follow default',
                on: 'Enabled',
                off: 'Disabled',
              })
              .setValue(this.plugin.settings[key])
              .onChange(async (value) => {
                await this.plugin.updateSettings({ [key]: normalizeStyle(value) });
              }),
          );
        },
      })),
      {
        name: 'Local tag vertical padding',
        desc: 'Adjust the vertical padding of local tags (##tag), in pixels. Negative values make tags shorter; positive values make them taller. Set to 0 to restore the default.',
        render: (setting) => {
          setting.addSlider((slider) =>
            slider
              .setLimits(-5, 5, 0.25)
              .setInstant(true)
              .setValue(this.plugin.settings.tagVerticalPadding)
              .onChange(async (value) => {
                await this.plugin.setTagVerticalPadding(value);
              }),
          );
        },
      },
    ];
  }

  private colorSetting(
    key: 'tagTextColor' | 'tagBackgroundColor',
    name: string,
    property: 'color' | 'backgroundColor',
  ): SettingDefinitionItem {
    const value = this.plugin.settings[key];
    return {
      name,
      desc: value
        ? `Custom color: ${value}. Select Reset to theme to use the theme color.`
        : 'Using the theme color. Choose a color to apply it to local tags only.',
      render: (setting) => {
        setting.addColorPicker((picker) => {
          if (value) picker.setValue(value);
          else {
            // Resolve the theme's actual color in this document for the picker swatch.
            const sample = this.containerEl.createSpan({ cls: 'local-tags-tag' });
            const computed = sample.ownerDocument.defaultView?.getComputedStyle(sample);
            const color = computed?.[property].match(/[\d.]+/g);
            sample.remove();
            picker.setValueRgb({
              r: Number(color?.[0] ?? 128),
              g: Number(color?.[1] ?? 128),
              b: Number(color?.[2] ?? 128),
            });
          }
          picker.onChange(async (color) => {
            await this.plugin.updateSettings({ [key]: color });
            setting.setDesc(
              `Custom color: ${this.plugin.settings[key]}. Select Reset to theme to use the theme color.`,
            );
          });
        });
        setting.addButton((button) =>
          button.setButtonText('Reset to theme').onClick(async () => {
            await this.plugin.updateSettings({ [key]: '' });
            this.update();
          }),
        );
      },
    };
  }
}
