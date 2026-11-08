# Usage

Start with the [README Quick start](../README.md#quick-start) for tag entry, completion, the tag panel, and search. This guide covers input rules, recognition limits, shared and per-note appearance settings, panel actions, in-note navigation, and search caveats.

## Input rules

- Use `##topic` for a local tag and `/` for hierarchy, such as `##people/Alex/work`; `## Heading` is a Markdown heading.
- Names are case-sensitive, and Unicode names such as `##people/Zoë` are supported.
- A space, line break, or another tag-ending character ends a tag. A bare `##` starts completion but is not a completed tag.
- Names made only of digits, or digits and `/`, are ordinary text. Leading, trailing, or repeated `/` creates an invalid empty hierarchy level.

## Recognition limits

- Tags in code spans and blocks, YAML frontmatter, links and images, URLs, HTML, and escaped notation such as `\##example` are excluded.
- Callout titles, callout bodies, and table cells support local tags with the same exclusions.
- Tags in Obsidian `%% comments %%` are included in completion and the tag panel but are not shown in Reading View.

## Completion settings

Open **Settings → Local Tags** to choose **Completion matching**. **Substring match** finds names containing the input and is the default. **Prefix match** finds names starting with the input, including the start of a hierarchical name.

**Case-sensitive completion** is off by default, including for existing installations. Enable it to compare uppercase and lowercase letters separately. Suggestions preserve the original spelling when displayed and inserted, and tag identity remains case-sensitive.

Completion ranks exact matches first, then prefix matches, then other substring matches, with up to ten suggestions from the current file.

## Appearance settings

Open **Settings → Local Tags**. These shared settings apply in Source mode, Live Preview, and Reading View.

| Setting label              | Meaning                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| Local tag text color       | Set the text color for valid local tags.                                                   |
| Local tag background color | Set the tag background color.                                                              |
| Local tag bold             | Follow the default style, enable bold, or disable bold.                                    |
| Local tag underline        | Follow the default style, enable an underline, or disable it.                              |
| Local tag italic           | Follow the default style, enable italic, or disable it.                                    |
| Local tag vertical padding | Adjust vertical padding from −5 to +5 px in 0.25 px steps; 0 restores the default padding. |

**Reset to theme** clears a color override. For bold, underline, and italic, choose **Follow default**, **Enabled**, or **Disabled**.

**Hide local tag prefix when not editing** is off by default. When enabled, valid tags hide `##` in Reading View and while inactive in Live Preview. Moving the cursor into a tag or selecting it shows the prefix. Source mode always shows `##`, and the Markdown source remains unchanged.

## Per-note decoration

### Configuration format

Add a top-level Markdown heading whose text is exactly `local-tags-config`, followed by a single unordered list of tag definitions. Any heading level is accepted. The section ends at the next heading of the same or a higher level, or at the end of the note.

```md
## local-tags-config

- ##project
  - text-color: \#ffffff
  - background-color: \#174266
  - border-color: \#5da9e9
  - bold: on
  - underline: off
  - italic:
- ##project/review
  - background-color: \#49345c
  - underline: on

## Notes

Discuss ##project and ##project/review here.
```

Each tag has six optional settings, shown below in the order used by **Add missing settings** and **Remove empty settings**.

| Setting            | Accepted values                                   |
| ------------------ | ------------------------------------------------- |
| `text-color`       | A six-digit hexadecimal color, such as `#ffffff`. |
| `background-color` | A six-digit hexadecimal color, such as `#174266`. |
| `border-color`     | A six-digit hexadecimal color, such as `#5da9e9`. |
| `bold`             | `on` or `off`.                                    |
| `underline`        | `on` or `off`.                                    |
| `italic`           | `on` or `off`.                                    |

Color values accept either `#RRGGBB` or `\#RRGGBB`. Color controls write the escaped form to keep the color value from becoming a standard Obsidian tag. Use lowercase `on` and `off` for emphasis settings.

Existing sections named `local-tags` and settings nested under a `style` list item are also accepted. Keep one configuration section and one definition per tag. Use either direct attributes or a `style` group within a definition.

### Inheritance and errors

Decoration is resolved separately for each setting, starting with the shared appearance settings and theme defaults, then applying each configured ancestor, and finally the tag's own values. The result applies in Source mode, Live Preview, Reading View, and the tag panel, within the current note.

A missing setting, an empty value such as `italic:`, or a tag definition with no attributes inherits the value from its parent, or from the shared settings for a root tag. Empty values are valid. An explicit `off` overrides an inherited `on`.

In the example, `##project/review` inherits the text color, border color, and bold setting from `##project`, and supplies its own background color and underline setting. Its italic setting follows the shared settings or theme.

A nonempty invalid value, such as `text-color: red` or `bold: yes`, appears as an error in the panel. The tag stays valid, its other valid settings still apply, and the invalid setting inherits from its parent or the shared settings. Correct errors before using actions that write configuration, including color editing.

Structural errors, including duplicate definitions, duplicate attributes, duplicate configuration headings, or definitions split across separate top-level lists, also prevent configuration writes. Previously valid decoration can remain while such errors are corrected. Unknown items produce warnings and keep their source text.

Configuration changes are reflected as the note is edited or changed externally.

### Tag panel actions

Run **Open tag panel** and expand **Settings, actions and messages**. Its summary shows **Errors** with the current error count, and the area opens when a new error is reported. Messages identify the affected line and tag when available.

The **Target** display shows the tag whose configuration block contains the editor caret. Anywhere else, it shows **All tags**. In Reading View, the target is **All tags**. This target controls **Random decoration**.

Use a single cursor when running **Random decoration** in editing mode. Multiple cursors cause the action to be rejected, including when the target shows **All tags**.

| Button                     | Effect                                                                                                                                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Add missing settings**   | Add definitions for recognized local tags that lack one, then add missing attributes with empty values to all definitions. Create the configuration section if needed. Preserve existing values and put attributes in the order shown above. |
| **Remove empty settings**  | Remove empty known attributes and put remaining attributes in the order shown above. Preserve tag definitions, including those left with no attributes, and retain nonempty values and attached content.                                     |
| **Random decoration**      | In editing mode, randomize the tag whose configuration block contains the single caret. With **All tags**, generate colors for root tags so descendants inherit them. Reading View uses this whole-note operation.                           |
| **Sort settings**          | Sort tag definitions by their case-sensitive tag names, keeping each definition's content together.                                                                                                                                          |
| **Expand to tag headings** | Show the configuration's tag entries and fold their attribute lists in Source mode or Live Preview. This changes editor folds.                                                                                                               |

For example, **Remove empty settings** changes the following configuration.

```md
- ##tag1
  - bold: on
  - italic:
- ##tag2
  - bold:
  - italic:
```

The resulting definitions keep both tags.

```md
- ##tag1
  - bold: on
- ##tag2
```

Random decoration uses a fixed vivid complementary palette for text, background, and border colors. Existing colors can be replaced. Bold, underline, and italic retain their current values. Prefix an attribute with `.` to preserve it during random decoration, such as `.text-color: \#ffffff`. A `.style` group excludes all its attributes from random decoration while keeping their decoration active.

### Color swatches

In Source mode or Live Preview, click the swatch beside a valid color in the configuration. Enter a six-digit hex color or adjust the hue, saturation, and lightness sliders, then choose **Apply**. **Cancel** or Esc closes the picker. If the note changes while the picker is open, the update is canceled to protect the edited text.

## In-note navigation

Shift+left-click a tag in the panel, without Ctrl, Command, or Alt, to scroll to its first occurrence in the current note. Repeat to visit the next occurrence in source order, returning to the first after the last. A parent tag also matches its descendants, so `##people` includes `##people/Alex`.

Source mode, Live Preview, and Reading View highlight the matching line and outline the tag. Source mode and Live Preview preserve the editor cursor and selection. Navigation also preserves the hidden `##` prefix on inactive Live Preview tags when prefix hiding is enabled. Folded sections expand to reveal the match.

In Reading View, a nested list highlights the matching displayed line. In Reading View and rendered Live Preview tables, the line highlight stays within the matching cell. Tags hidden in `%% comments %%` are skipped in Reading View. If no visible occurrence is available, a notice suggests checking the note in editing mode.

Editing the note or changing the target file, Markdown pane, or display mode clears the highlight and resets the cycle. Choosing another tag starts from that tag's first occurrence. Disabling the plugin clears the highlight.

## Search caveats

Clicking a tag in the panel replaces the existing Obsidian search query with a text search for the current file and tag. Results can include text in places excluded from tag recognition, such as code blocks.
