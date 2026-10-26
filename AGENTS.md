---
model-name: unknown
reasoning-effort: unknown
output-datetime: '2026-10-26 23:47:41'
guide: agents-md-editor/AGENTS.guide.md
guide-version: 1.0.0
---

# Project instructions

## Maintaining this file

- Keep these instructions specific to this repository and consistent with its documentation.
- Record confirmed behavior and policies; do not present proposals or unperformed checks as completed work.
- Keep detailed user and development instructions in the documents linked from the README.

## Project overview

- Local Tags provides file-local `##tags` for desktop Obsidian `1.14.4` and later.
- The published feature set includes tag recognition, hierarchical names, completion, tag decoration, a hierarchical panel, current-file search, and shared appearance settings.

## Layout and documentation

- `src/main.ts` connects the plugin to Obsidian; `src/domain/`, `src/editor/`, and `src/services/` separate core logic, editor integration, and document services.
- `tests/` contains automated behavior and tooling tests; `scripts/` contains build and release helpers.
- Use [the README's document index](README.md#documentation-and-updates) to find the document relevant to a change.
- Update the relevant document when a confirmed behavior, command, file format, or working rule changes.
- Record user-visible changes in `CHANGELOG.md`, including their purpose when needed to understand the change.

## Development conventions

- Use Node.js 24 and the committed npm lockfile; install with `npm ci --ignore-scripts`.
- Follow `tsconfig.json` and the repository's formatting and lint configuration.
- Use English by default for UI labels, user-facing messages, comments, test descriptions, and repository documentation. Use non-English literals only when a focused Unicode check or a documented external interface requires them.

## Build and validation

- `npm run check` runs the repository's automated quality checks.
- `npm test` runs automated tests; `npm run build` performs type checking and produces the minified distribution.
- `npm run format:check` checks formatting without rewriting files.
- Choose tests that check observable behavior or meaningful boundaries; do not duplicate coverage merely to test each internal function.
- Automated logic and DOM checks do not establish that a behavior has been verified in the running Obsidian application; report the conditions actually checked.
- For documentation-only changes, check content, links, and formatting rather than running unrelated application checks.

## Files and distribution

- Treat the source, repository settings, documentation, and release metadata as maintained inputs; do not hand-edit generated `dist/` files.
- Generate third-party notices from the production bundle and retain their copyright notices and license terms.
- Keep documentation, examples, fixtures, test names, and comments limited to published behavior; exclude personal paths, credentials, and unrelated material.
- Preserve existing user notes and settings when describing or performing local installation.

## Versions and releases

- The initial version is `0.1.0`; the author and original-code copyright name is `mstksb`.
- Keep `package.json`, the lockfile's root package, `manifest.json`, and `versions.json` consistent using `npm run release:prepare -- <version>`.
- Keep `CHANGELOG.md` as the source for release notes.
- Release tags identify the exact version; Actions validates and builds that version, then creates a draft with distribution assets for the maintainer to publish.
- Do not create commits, merge, push, tag, or publish a release unless the current task authorizes the operation; merging to `main` requires the user's approval.
- The original code is `GPL-3.0-only`. Preserve the applicable third-party licenses.
- The project does not accept pull requests and does not currently use GitHub Issues for support or requests.
