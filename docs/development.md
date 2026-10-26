---
model-name: unknown
reasoning-effort: unknown
output-datetime: '2026-10-26 23:47:41'
---

# Development

Use Node.js 24 and npm. The repository includes its dependency lockfile so installs can be reproduced.

## Install and check

```sh
npm ci --ignore-scripts
npm run check
```

Use individual commands when investigating a specific change:

| Command                | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `npm test`             | Run the automated behavior and tooling tests.              |
| `npm run format:check` | Check formatting without rewriting files.                  |
| `npm run build`        | Type-check the source and build the minified distribution. |

Tests focus on documented behavior, input/output boundaries, editing state, and DOM results. These checks run without launching Obsidian. Their success does not establish that actual application input, focus, or theme appearance has been verified.

## Language conventions

Use English by default for UI labels, user-facing messages, source comments, test descriptions, and documentation. Examples should use English wording. Focused Unicode tests may contain non-English input when it is needed to verify supported text.

## Source layout

| Location        | Responsibility                               |
| --------------- | -------------------------------------------- |
| `src/main.ts`   | Register and connect the plugin to Obsidian. |
| `src/domain/`   | Tag parsing and index logic.                 |
| `src/editor/`   | Editor integration and editing state.        |
| `src/services/` | Current-document services and search.        |
| `tests/`        | Behavior, DOM, and tooling checks.           |
| `scripts/`      | Build and release helpers.                   |

Keep expectations based on documented behavior. A test should detect a meaningful regression rather than repeat each line of an internal function's implementation.

## Build output

`npm run build` writes the distribution to `dist/local-tags/`:

- `main.js`: minified plugin code, including the complete GPL v3 text and applicable third-party notices.
- `manifest.json`: plugin identity, version, and Obsidian compatibility.
- `styles.css`: plugin styles.
- `LICENSE`: the project's GPL v3 terms.
- `THIRD-PARTY-NOTICES.txt`: notices for third-party code retained in the production bundle.

Additional build-analysis output is for development and is not a runtime installation file. Do not hand-edit generated files. Changes to dependencies require regenerating and checking the applicable notices.

Obsidian's community-plugin installer downloads only `main.js`, `manifest.json`, and `styles.css`; it does not install the separate license attachments. The build therefore embeds the complete `LICENSE` text and third-party license notices in `main.js` as comments. Keep this embedding when changing the build: a license identifier or URL alone does not carry the license text to those installations. See the [Obsidian release and installation process](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin) and the [GNU explanation of including the license](https://www.gnu.org/licenses/gpl-faq.en.html#WhyMustIInclude).

## Manual verification

1. Build the exact source and settings intended for release.
2. Copy the distribution files to a test vault's `.obsidian/plugins/local-tags/` directory.
3. Open the vault in Obsidian and enable Local Tags; disable and re-enable an already enabled installation after replacing files.
4. Check tag entry, completion, file switching, the tag panel, current-file search, Source mode, Live Preview, Reading View, and appearance settings.
5. Confirm the plugin's behavior after disabling and re-enabling it.

Use the same version of the source, settings, and distribution for verification and release. Keep the vault's notes and existing settings when replacing the runtime files.

Once a release is approved for Obsidian's community directory, also check installation or update through Obsidian's community-plugin settings.

## Prepare a release

Record user-visible changes under `[Unreleased]` in `CHANGELOG.md`, which is the source for release notes. When the version is ready, run:

```sh
npm run release:prepare -- 0.1.0
```

Replace `0.1.0` with the intended stable version for subsequent releases. The command updates `package.json`, the lockfile's root package, `manifest.json`, and `versions.json`; it moves the unreleased changelog entries to the version's dated section and leaves an empty `[Unreleased]` section. Release dates use UTC.

The command does not commit, create a tag, push, or publish a release. Review its changes and run the checks before following the approved branch and release process.

## Release draft and publication

1. Use the approved commit for the release; the version tag must match `manifest.json` exactly, such as `0.1.0`.
2. Create and push that tag when authorized.
3. GitHub Actions checks and builds the tagged source, then creates a draft release using the corresponding `CHANGELOG.md` section.
4. Review the draft and its five distribution files, then publish it as the maintainer.

Pushing source to the public repository makes that source visible before a draft release is published. A draft is a review step for the distribution, not a way to keep pushed source confidential.

Keep the source at the tag and the attached distribution in agreement. GitHub's source archives identify the tagged source; the repository contains the build configuration and locked dependency information needed to reproduce it. Check the license texts, notices, and source availability along with the distribution.

Publishing a GitHub release and listing the plugin in Obsidian's community directory are separate steps. Community-directory installation becomes available after the listing is accepted.
