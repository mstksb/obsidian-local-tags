function rgbToHsl(value: string): [number, number, number] {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map(
    (offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255,
  );
  const high = Math.max(r, g, b);
  const low = Math.min(r, g, b);
  const delta = high - low;
  const lightness = (high + low) / 2;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  const hue = !delta
    ? 0
    : high === r
      ? ((g - b) / delta) % 6
      : high === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4;
  return [
    Math.round((hue * 60 + 360) % 360),
    Math.round(saturation * 100),
    Math.round(lightness * 100),
  ];
}

function hslToRgb([hue, saturation, lightness]: [number, number, number]): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const channels =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];
  return `#${channels
    .map((channel) =>
      Math.round((channel + m) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** The caller owns placement, dismissal outside the form, and focus restoration. */
export function createColorPicker(
  document: Document,
  value: string,
  onApply: (value: string) => void,
  onCancel: () => void,
  options: { className?: string; title?: string } = {},
): HTMLFormElement {
  const ownerWindow = document.defaultView;
  if (!ownerWindow) throw new Error('Color pickers require a document window.');
  const picker = ownerWindow.createEl('form');
  picker.className = options.className ?? 'local-tags-color-picker';
  picker.dataset.localTagPicker = 'true';
  picker.setAttribute('role', 'dialog');
  picker.setAttribute('aria-label', options.title ?? 'Change color');
  if (options.title) {
    const title = ownerWindow.createEl('strong');
    title.textContent = options.title;
    picker.append(title);
  }
  const preview = ownerWindow.createDiv();
  preview.className = 'local-tags-color-preview';
  preview.dataset.pickerPreview = 'true';
  preview.setAttribute('aria-label', 'Color preview');
  picker.append(preview);

  const hexLabel = ownerWindow.createEl('label');
  hexLabel.textContent = 'Hex color';
  const hex = ownerWindow.createEl('input');
  hex.type = 'text';
  hex.dataset.pickerHex = 'true';
  hex.dataset.localTagHex = 'true';
  hex.value = value;
  hex.spellcheck = false;
  hexLabel.append(hex);
  picker.append(hexLabel);

  const sliders: HTMLInputElement[] = [];
  for (const [channel, label, maximum] of [
    ['h', 'Hue', 360],
    ['s', 'Saturation', 100],
    ['l', 'Lightness', 100],
  ] as const) {
    const labelElement = ownerWindow.createEl('label');
    labelElement.textContent = label;
    const slider = ownerWindow.createEl('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = String(maximum);
    slider.step = '1';
    slider.value = '0';
    slider.dataset.pickerChannel = channel;
    slider.dataset.localTagChannel = channel;
    labelElement.append(slider);
    picker.append(labelElement);
    sliders.push(slider);
  }

  const status = ownerWindow.createDiv();
  status.setAttribute('role', 'status');
  picker.append(status);
  const actions = ownerWindow.createDiv();
  actions.className = 'local-tags-color-actions';
  const cancel = ownerWindow.createEl('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  cancel.dataset.pickerAction = 'cancel';
  cancel.dataset.localTagPickerAction = 'cancel';
  const apply = ownerWindow.createEl('button');
  apply.type = 'submit';
  apply.textContent = 'Apply';
  apply.dataset.pickerAction = 'apply';
  apply.dataset.localTagPickerAction = 'apply';
  actions.append(cancel, apply);
  picker.append(actions);

  const valid = () => /^#[0-9a-f]{6}$/iu.test(hex.value);
  const refresh = () => {
    const usable = valid();
    apply.disabled = !usable;
    hex.setAttribute('aria-invalid', String(!usable));
    status.textContent = usable ? '' : 'Enter # followed by six hexadecimal digits.';
    if (!usable) return;
    preview.setCssProps({ '--local-tags-picker-color': hex.value });
    const hsl = rgbToHsl(hex.value);
    sliders.forEach((slider, index) => {
      slider.value = String(hsl[index]);
    });
  };
  refresh();
  hex.addEventListener('input', refresh);
  for (const slider of sliders)
    slider.addEventListener('input', () => {
      const [h = 0, s = 0, l = 0] = sliders.map((input) => Number(input.value));
      hex.value = hslToRgb([h, s, l]);
      preview.setCssProps({ '--local-tags-picker-color': hex.value });
      apply.disabled = false;
      hex.setAttribute('aria-invalid', 'false');
      status.textContent = '';
    });
  cancel.addEventListener('click', onCancel);
  picker.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.isComposing) return;
    event.preventDefault();
    event.stopPropagation();
    onCancel();
  });
  picker.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (valid()) onApply(hex.value.toLowerCase());
  });
  return picker;
}
