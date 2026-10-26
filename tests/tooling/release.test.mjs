import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildProject } from '../../esbuild.config.mjs';
import {
  checkRelease,
  prepareRelease,
  releaseNotes,
  validateProject,
} from '../../scripts/release-project.mjs';

const stringify = (value) => JSON.stringify(value, null, 2) + '\n';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'local-tags-release-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const files = {
    'package.json': stringify({
      name: 'local-tags',
      version: '0.1.0',
      author: 'mstksb',
      license: 'GPL-3.0-only',
    }),
    'package-lock.json': stringify({
      name: 'local-tags',
      version: '0.1.0',
      lockfileVersion: 3,
      packages: { '': { name: 'local-tags', version: '0.1.0', license: 'GPL-3.0-only' } },
    }),
    'manifest.json': stringify({
      id: 'local-tags',
      name: 'Local Tags',
      version: '0.1.0',
      minAppVersion: '1.14.4',
      author: 'mstksb',
    }),
    'versions.json': stringify({ '0.1.0': '1.14.4' }),
    'CHANGELOG.md':
      '---\nmodel-name: unknown\n---\n\n# Changelog\n\n## [Unreleased]\n\n### Added\n\n- File-local tags.\n',
    LICENSE: await readFile(new URL('../../LICENSE', import.meta.url), 'utf8'),
    'styles.css': '.local-tags-tag { color: inherit; }\n',
  };
  for (const [name, content] of Object.entries(files)) await writeFile(join(root, name), content);
  return root;
}

async function metadata(root) {
  const names = [
    'package.json',
    'package-lock.json',
    'manifest.json',
    'versions.json',
    'CHANGELOG.md',
  ];
  return Object.fromEntries(
    await Promise.all(names.map(async (name) => [name, await readFile(join(root, name), 'utf8')])),
  );
}

test('metadata validation detects a mismatched plugin version and compatibility entry', async (t) => {
  const root = await fixture(t);
  await validateProject(root);
  const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
  manifest.version = '0.2.0';
  await writeFile(join(root, 'manifest.json'), stringify(manifest));
  await assert.rejects(validateProject(root), /versions must match/u);
  manifest.version = '0.1.0';
  await writeFile(join(root, 'manifest.json'), stringify(manifest));
  await writeFile(join(root, 'versions.json'), stringify({ '0.1.0': '1.15.0' }));
  await assert.rejects(validateProject(root), /map the current version/u);
});

test('preparing the first release preserves the frontmatter and creates versioned notes', async (t) => {
  const root = await fixture(t);
  await prepareRelease(root, '0.1.0', { date: '2026-10-26' });
  assert.equal(await checkRelease(root, '0.1.0'), '### Added\n\n- File-local tags.\n');
  const changelog = await readFile(join(root, 'CHANGELOG.md'), 'utf8');
  assert.ok(changelog.startsWith('---\nmodel-name: unknown\n---\n'));
  assert.match(changelog, /## \[Unreleased\]\n\n## \[0\.1\.0\] - 2026-10-26/u);
  const before = await metadata(root);
  await assert.rejects(prepareRelease(root, '0.1.0'), /already in CHANGELOG/u);
  assert.deepEqual(await metadata(root), before);
});

test('a new release updates package, lockfile, manifest, and compatibility history together', async (t) => {
  const root = await fixture(t);
  await prepareRelease(root, '0.2.0', { date: '2026-10-26' });
  const project = await validateProject(root);
  assert.equal(project.pkg.version, '0.2.0');
  assert.equal(project.lock.version, '0.2.0');
  assert.equal(project.lock.packages[''].version, '0.2.0');
  assert.equal(project.manifest.version, '0.2.0');
  assert.deepEqual(project.versions, { '0.1.0': '1.14.4', '0.2.0': '1.14.4' });
});

test('invalid, lower, or unprepared release versions fail without changing the project', async (t) => {
  const root = await fixture(t);
  const before = await metadata(root);
  for (const version of ['v0.1.0', '0.1.0-beta.1', '00.1.0', '0.0.9', '../0.1.0']) {
    await assert.rejects(prepareRelease(root, version));
    assert.deepEqual(await metadata(root), before);
  }
  await assert.rejects(prepareRelease(root, '0.1.0', { date: '2026-02-30' }), /calendar date/u);
  await assert.rejects(prepareRelease(root, '0.1.0', { date: '2026-13-01' }), /calendar date/u);
  await assert.rejects(checkRelease(root, '0.1.0'), /no release section/u);
  await assert.rejects(checkRelease(root, '0.2.0'), /exactly match/u);
  assert.deepEqual(await metadata(root), before);
});

test('empty unreleased notes prevent preparation and release notes exclude other versions', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, 'CHANGELOG.md'), '# Changelog\n\n## [Unreleased]\n\n');
  const before = await metadata(root);
  await assert.rejects(prepareRelease(root, '0.1.0'), /must describe the changes/u);
  assert.deepEqual(await metadata(root), before);
  assert.equal(
    releaseNotes(
      '# Changelog\n\n## [Unreleased]\n\n- Later.\n\n## [0.1.0] - 2026-10-26\n\n- First.\n\n## [0.0.1]\n\n- Older.\n',
      '0.1.0',
    ),
    '- First.\n',
  );
});

test('the distribution build writes the five install and license files for the same version', async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, 'src'));
  await writeFile(join(root, 'src/main.ts'), 'export const greeting: string = "Local Tags";\n');
  const output = await buildProject(root);
  assert.deepEqual((await readdir(output)).sort(), [
    'LICENSE',
    'THIRD-PARTY-NOTICES.txt',
    'main.js',
    'manifest.json',
    'metafile.json',
    'styles.css',
  ]);
  const script = await readFile(join(output, 'main.js'), 'utf8');
  assert.match(script, /Local Tags 0\.1\.0 \| Copyright \(C\) 2026 mstksb \| GPL-3\.0-only/u);
  assert.match(script, /Third-party software included in main\.js/u);
  const license = await readFile(join(root, 'LICENSE'), 'utf8');
  assert.ok(
    script.includes(license),
    'The runtime bundle must contain the complete project license.',
  );
  assert.equal(script.split(license).length - 1, 1, 'The project license must occur exactly once.');
  await buildProject(root);
  assert.equal(await readFile(join(output, 'main.js'), 'utf8'), script);
  const notices = await readFile(join(output, 'THIRD-PARTY-NOTICES.txt'), 'utf8');
  assert.ok(script.includes(notices), 'Third-party notices must remain in the runtime bundle.');
  assert.doesNotMatch(script, /sourceMappingURL/u);
  assert.equal(
    await readFile(join(output, 'LICENSE'), 'utf8'),
    await readFile(join(root, 'LICENSE'), 'utf8'),
  );
  assert.equal(
    await readFile(join(output, 'styles.css'), 'utf8'),
    await readFile(join(root, 'styles.css'), 'utf8'),
  );
  assert.equal(JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8')).version, '0.1.0');
});
