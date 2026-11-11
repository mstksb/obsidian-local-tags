# Changelog

User-visible changes are recorded here. Entries under `[Unreleased]` have not been released.

## [Unreleased]

## [0.6.0] - 2026-11-11

### Added

- Filter the current note's tag panel immediately by tag name, description, or both, using case-insensitive substring matching and independent checkboxes. Keep ancestor context, preserve the search while switching notes, and support Japanese and English search controls.

### Documentation

- Add an animated README walkthrough for tag-panel search and its tag-name and summary filters.

## [0.5.0] - 2026-11-10

### Added

- Define a description on the same line as a tag declaration under `local-tags-config`, scoped to the current note and complete tag name.
- Show descriptions beside completion suggestions and in note and tag-panel tooltips, including keyboard focus in the panel. Completion still inserts only the tag name and a trailing space.

### Changed

- Show click and Shift+click instructions above the tag panel's list so tag hover can display its description.

### Documentation

- Accept bug reports through GitHub Issues on a best-effort basis and allow feature requests with very low priority.
- Add animated README walkthroughs for completion, file-local tag vocabularies, random decoration, in-note navigation, and current-file search.
- Add a README walkthrough for tag descriptions in completion suggestions and note and panel tooltips.

## [0.4.1] - 2026-11-09

### Fixed

- Reduce typing lag in Source mode and Live Preview by sharing Markdown syntax trees and reusing cached per-document settings.
- Reuse tag decorations and the current-file index during ordinary cursor movement while preserving updates when editing tags or revealing their prefixes.
- Preserve per-note tag decoration and the full tag list when moving the caret into or out of Live Preview tables and editing table cells.

## [0.4.0] - 2026-11-08

### Added

- Store per-note tag decoration under `local-tags-config`, with text, background, and border colors plus bold, underline, and italic settings.
- Inherit individual settings through hierarchical tags, falling back to shared appearance settings and theme defaults.
- Add a collapsible settings, actions, and messages area to the tag panel, with an error count and a caret-based decoration target.
- Add missing tag definitions and empty attributes, or remove empty attributes while retaining tag definitions. Both actions order attributes as text color, background color, border color, bold, underline, then italic.
- Generate vivid complementary colors for the caret's configured tag or the note's root tags, with per-attribute exclusions and preserved emphasis settings.
- Sort tag definitions, expand the configuration to tag headings in editing mode, and edit colors through inline swatches with hex and HSL controls.

### Behavior

- Missing and empty settings inherit without errors. A nonempty invalid setting reports an error while the tag and its other valid settings remain active, and the invalid setting inherits.
- Reflect configuration changes during editing and external updates. Block configuration writes while errors remain or an insertion would enter a comment, preserving the note's content.

## [0.3.0] - 2026-11-06

### Added

- Shift+click a tag in the panel to cycle through its occurrences and descendant tags within the current note.
- Highlight the matching line and outline the tag in Source mode, Live Preview, and Reading View while preserving the editor cursor and selection. Nested lists and rendered table cells highlight the matching displayed line.

## [0.2.2] - 2026-11-06

### Changed

- Detect Reading View highlights during the existing DOM traversal.
- Use a plain underline for invalid tags to satisfy the CSS compatibility check.

## [0.2.1] - 2026-11-06

### Changed

- Use a DOM collection lookup when detecting Reading View highlights.
- Add a documented, declaration-specific CSS lint exception for supported wavy error underlines.

## [0.2.0] - 2026-11-06

### Added

- Choose substring or prefix matching for tag completion.
- Toggle case-sensitive completion while preserving each tag's original spelling.
- Hide the `##` prefix in Reading View and on inactive tags in Live Preview. Source mode always shows the prefix.

### Changed

- Completion ignores case by default. Existing settings retain substring matching and keep prefix hiding disabled.

### Distribution

- Validate releases with the official Obsidian ESLint rules and generate build-provenance attestations for the five distribution files.

## [0.1.1] - 2026-11-05

### Fixed

- Preserve tag decorations in unchanged Reading View sections after partial document updates.
- Decorate tags in Reading View documents without their own Window and create nodes in the correct document.

### Changed

- Keep basic operations in the README Quick start and shorten the usage guide to input rules, recognition limits, appearance settings, and search caveats.

## [0.1.0] - 2026-10-27

### Added

- File-local `##tags` and hierarchical tag names.
- Completion suggestions from the current Markdown file.
- Tag decoration in Source mode, Live Preview, and Reading View.
- A hierarchical tag panel with current-file text search.
- Shared appearance settings for tag colors, emphasis, and vertical padding.

### Distribution

- Include the complete GPL v3 text and third-party notices in the runtime JavaScript for community-plugin installations.

### Changed

- Apply appearance preferences through CSS custom properties and restore inherited defaults when overrides are cleared.
- Expose appearance controls to settings search and retain the tag panel position during plugin updates.
- Use **Open tag panel** for the command. The command ID is now `local-tags:open-tag-panel`; reassign any shortcuts set for an earlier development build.
