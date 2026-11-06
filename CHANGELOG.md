# Changelog

User-visible changes are recorded here. Entries under `[Unreleased]` have not been released.

## [Unreleased]

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
