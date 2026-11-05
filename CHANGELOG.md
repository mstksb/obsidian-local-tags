# Changelog

User-visible changes are recorded here. Entries under `[Unreleased]` have not been released.

## [Unreleased]

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
