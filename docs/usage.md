---
model-name: unknown
reasoning-effort: unknown
output-datetime: '2026-10-26 23:47:41'
---

# Usage

Local Tags recognizes `##tags` in the current Markdown file. A tag with the same name in another note has its own completion and panel context.

## Write local tags

```markdown
Plan the next step. ##project
Talk to Alex. ##people/Alex
Follow up next week. ##people/Alex/work
```

Use `/` to separate hierarchy levels. Tag names are case-sensitive, and Unicode names such as `##people/Zoë` are supported.

A space, line break, or another tag-ending character ends a tag. `## Heading` is a Markdown heading, while `##topic` is a local tag. A bare `##` starts completion but is not a completed tag.

Names made only of digits, or digits and `/`, are ordinary text. Empty hierarchy levels, such as a leading, trailing, or repeated `/`, are shown as errors and do not appear as valid panel entries or completion suggestions.

## Markdown contexts

Tag recognition excludes code spans and code blocks, YAML frontmatter, links and images, URLs, HTML, and escaped tags such as `\##example`.

Tags in callout titles, callout bodies, and table cells are supported; the same exclusions still apply inside them. Tags inside Obsidian `%% comments %%` participate in the file's tag index but are not added to the visible Reading View text.

Local tags remain separate from Obsidian's built-in `#tag` index.

## Complete a tag name

1. Enter `##` and part of a tag name already present in the current note.
2. Use the suggestion list to select a candidate.
3. Press Enter to insert the full tag name and one trailing space.

The list contains up to 10 distinct valid names from the current Markdown file. Exact matches come first, followed by prefix matches and then other substring matches; names within each group are sorted. Matching is case-sensitive.

Completion replaces the whole edited tag, including text after a cursor placed in its middle. Existing whitespace after the tag is kept, so accepting a suggestion next to a space can leave more than one space.

Press Esc to close the list without changing the note. Tab and clicking a candidate do not accept a completion. The list can appear again when further input produces matching candidates.

## Open the tag panel

Run **Open tag panel** from the command palette. The Local Tags panel displays the current file's valid tags in a hierarchy, with repeated names combined into one entry. A parent row is shown when only its descendants occur in the note.

The panel follows the active Markdown file. Moving focus to a search or utility panel keeps the last Markdown context; selecting a non-Markdown file or an empty document pane clears the applicable tag list.

## Search from the panel

Click a tag in the panel to open Obsidian's standard search with a query for the current file and that tag text. The operation replaces the existing search query and focuses the search field.

This is a text search, rather than a search limited to recognized tag positions. For example, a matching tag string in a code block can be found even though code is excluded from tag recognition.

## Appearance settings

Open **Settings → Local Tags**:

| Setting label              | Meaning                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| Local tag text color       | Set the text color for valid local tags.                                                   |
| Local tag background color | Set the tag background color.                                                              |
| Local tag bold             | Follow the default style, enable bold, or disable bold.                                    |
| Local tag underline        | Follow the default style, enable an underline, or disable it.                              |
| Local tag italic           | Follow the default style, enable italic, or disable it.                                    |
| Local tag vertical padding | Adjust vertical padding from −5 to +5 px in 0.25 px steps; 0 restores the default padding. |

**Reset to theme** clears a color override. For bold, underline, and italic, choose **Follow default**, **Enabled**, or **Disabled**.

These shared settings affect valid local tags in Source mode, Live Preview, and Reading View. They are saved in the plugin's `data.json` and retained when the plugin is re-enabled.

## Check a local installation

Use a test vault to try tag entry, Enter completion, file switching, the tag panel, search, all three display modes, and changes to appearance settings. Re-enable the plugin after replacing its build files.

If a result differs between notes, first check the active file, the Markdown context around the tag, and the syntax rules above. Theme and editor behavior must be checked in the actual Obsidian window when assessing their appearance.

See [Development](development.md) for build files and manual installation.
