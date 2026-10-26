---
model-name: unknown
reasoning-effort: unknown
output-datetime: '2026-10-26 23:47:41'
---

# Local Tags

Local Tags adds file-local `##tags` to Obsidian. Use the same tag name in different notes without mixing their completion suggestions or tag lists.

Check [Releases](https://github.com/mstksb/obsidian-local-tags/releases) for published packages. Community-plugin installation becomes available after the plugin has been accepted into Obsidian's community directory.

## Features

- Write tags such as `##project` and hierarchical tags such as `##people/Alex`.
- Complete tag names from the current Markdown file, with up to 10 suggestions.
- Display tags in Source mode, Live Preview, and Reading View.
- Browse the current file's tags in a hierarchical panel.
- Click a tag in the panel to search for its text within the current file.
- Adjust the shared text color, background color, emphasis, and vertical padding in the plugin settings.

## Requirements

Desktop Obsidian `1.14.4` or later. Local Tags is a desktop-only plugin.

## Installation

For a locally built copy, place `main.js`, `manifest.json`, `styles.css`, `LICENSE`, and `THIRD-PARTY-NOTICES.txt` from `dist/local-tags/` into `<vault>/.obsidian/plugins/local-tags/` and enable **Local Tags** in Obsidian's community-plugin settings.

After replacing an installed build, disable and re-enable the plugin. If a new installation does not appear in the plugin list, reopen the vault.

## Quick start

1. Add `##project` or `##people/Alex` to a Markdown note.
2. Type `##` and part of an existing tag name, then press Enter to accept a suggestion.
3. Run the command **Open tag panel** to open the tag panel.
4. Click a tag in the panel to search the current file.
5. Open **Settings → Local Tags** to adjust tag appearance.

## Behavior to know

- Local tags use `##` and are separate from Obsidian's standard `#tags`.
- Names are case-sensitive: `##Project` and `##project` are different tags.
- Tags in code, frontmatter, links, URLs, HTML, and escaped notation are excluded.
- Names made only of digits, or digits and `/`, are treated as ordinary text.
- Panel searches use a text query and may also match the same text in places that are excluded from tag recognition.

See [Usage](docs/usage.md) for examples and settings.

## Limitations

Basic use with English and Japanese text is expected to work, but has not been comprehensively verified. Behavior in other languages remains unverified.

## Build and test

Use Node.js 24 and npm:

```sh
npm ci --ignore-scripts
npm run check
```

The production build is written to `dist/local-tags/`. See [Development](docs/development.md) for individual checks and the release process.

## Project policy

This project does not accept pull requests. GitHub Issues are not currently used for support or feature requests. Ongoing maintenance, support, and new features are not guaranteed.

## License

Copyright (C) 2026 mstksb.

The project's original code is licensed under the GNU General Public License, version 3 only (`GPL-3.0-only`). See [LICENSE](LICENSE) for the full terms. The complete license text is also embedded in the built `main.js` so it is retained when Obsidian installs only the runtime files.

Third-party components retain their respective licenses. Their notices are generated from the production bundle and included in `THIRD-PARTY-NOTICES.txt` and the built `main.js`.

## Documentation and updates

| File                                       | Purpose and update conditions                                                                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| [README.md](README.md)                     | Project overview, installation, project policy, and document index; update when these entry points or policies change.  |
| [AGENTS.md](AGENTS.md)                     | Project-specific editing instructions; update when the repository's working rules or references change.                 |
| [docs/usage.md](docs/usage.md)             | Published syntax, completion, panel behavior, and settings; update when user-visible behavior changes.                  |
| [docs/development.md](docs/development.md) | Build, test, manual checks, version preparation, and release procedure; update when those commands or processes change. |
| [CHANGELOG.md](CHANGELOG.md)               | User-visible changes for each release; update before preparing a release.                                               |
| [LICENSE](LICENSE)                         | License terms for the project's original code; keep licensing statements consistent with this file.                     |
