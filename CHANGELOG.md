---
model-name: unknown
reasoning-effort: unknown
output-datetime: '2026-10-26 23:31:49'
---

# Changelog

User-visible changes are recorded here. Entries under `[Unreleased]` have not been released.

## [Unreleased]

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
