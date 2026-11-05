---
model-name: unknown
reasoning-effort: unknown
output-datetime: '2026-11-05 17:39:36'
---

# Usage

Start with the [README Quick start](../README.md#quick-start) for tag entry, completion, the tag panel, and search. This guide covers input rules, recognition limits, appearance settings, and search caveats.

## Input rules

- Use `##topic` for a local tag and `/` for hierarchy, such as `##people/Alex/work`; `## Heading` is a Markdown heading.
- Names are case-sensitive, and Unicode names such as `##people/Zoë` are supported.
- A space, line break, or another tag-ending character ends a tag. A bare `##` starts completion but is not a completed tag.
- Names made only of digits, or digits and `/`, are ordinary text. Leading, trailing, or repeated `/` creates an invalid empty hierarchy level.

## Recognition limits

- Tags in code spans and blocks, YAML frontmatter, links and images, URLs, HTML, and escaped notation such as `\##example` are excluded.
- Callout titles, callout bodies, and table cells support local tags with the same exclusions.
- Tags in Obsidian `%% comments %%` are included in completion and the tag panel but are not shown in Reading View.

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

## Search caveats

Clicking a tag in the panel replaces the existing Obsidian search query with a text search for the current file and tag. Results can include text in places excluded from tag recognition, such as code blocks.
