# Usage

Start with the [README Quick start](../README.md#quick-start) for tag entry, completion, the tag panel, and search. This guide covers input rules, recognition limits, appearance settings, in-note navigation, and search caveats.

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

## In-note navigation

Shift+left-click a tag in the panel, without Ctrl, Command, or Alt, to scroll to its first occurrence in the current note. Repeat to visit the next occurrence in source order, returning to the first after the last. A parent tag also matches its descendants, so `##people` includes `##people/Alex`.

Source mode, Live Preview, and Reading View highlight the matching line and outline the tag. Source mode and Live Preview preserve the editor cursor and selection. Navigation also preserves the hidden `##` prefix on inactive Live Preview tags when prefix hiding is enabled. Folded sections expand to reveal the match.

In Reading View, a nested list highlights the matching displayed line. In Reading View and rendered Live Preview tables, the line highlight stays within the matching cell. Tags hidden in `%% comments %%` are skipped in Reading View. If no visible occurrence is available, a notice suggests checking the note in editing mode.

Editing the note or changing the target file, Markdown pane, or display mode clears the highlight and resets the cycle. Choosing another tag starts from that tag's first occurrence. Disabling the plugin clears the highlight.

## Search caveats

Clicking a tag in the panel replaces the existing Obsidian search query with a text search for the current file and tag. Results can include text in places excluded from tag recognition, such as code blocks.
