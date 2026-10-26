import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;
const json = (value) => JSON.stringify(value, null, 2) + '\n';

export function stableVersion(value) {
  if (typeof value !== 'string' || !versionPattern.test(value)) {
    throw new Error('Use a stable SemVer version without a prefix, for example 0.1.0.');
  }
  return value;
}

function compareVersions(left, right) {
  const a = stableVersion(left).split('.').map(BigInt);
  const b = stableVersion(right).split('.').map(BigInt);
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

async function readProject(root) {
  const values = await Promise.all(
    ['package.json', 'package-lock.json', 'manifest.json', 'versions.json'].map(async (name) =>
      JSON.parse(await readFile(resolve(root, name), 'utf8')),
    ),
  );
  return { pkg: values[0], lock: values[1], manifest: values[2], versions: values[3] };
}

export async function validateProject(root = projectRoot) {
  const project = await readProject(root);
  const { pkg, lock, manifest, versions } = project;
  const version = stableVersion(pkg.version);
  stableVersion(manifest.minAppVersion);
  if (manifest.id !== 'local-tags' || pkg.name !== 'local-tags') {
    throw new Error('The plugin id and package name must be local-tags.');
  }
  if (
    typeof pkg.author !== 'string' ||
    !pkg.author.trim() ||
    /[\r\n*]/u.test(pkg.author) ||
    manifest.author !== pkg.author
  ) {
    throw new Error('Package and manifest authors must match and use a single-line name.');
  }
  if (
    manifest.version !== version ||
    lock.version !== version ||
    lock.packages?.['']?.version !== version
  ) {
    throw new Error('package.json, package-lock.json, and manifest.json versions must match.');
  }
  if (pkg.license !== 'GPL-3.0-only' || lock.packages[''].license !== pkg.license) {
    throw new Error('Package and lockfile licenses must be GPL-3.0-only.');
  }
  if (versions[version] !== manifest.minAppVersion) {
    throw new Error('versions.json must map the current version to minAppVersion.');
  }
  for (const [released, minimum] of Object.entries(versions)) {
    stableVersion(released);
    stableVersion(minimum);
  }
  return project;
}

export function releaseNotes(changelog, version) {
  stableVersion(version);
  const heading = new RegExp(
    `^## \\[${version.replaceAll('.', '\\.')}\\](?: - \\d{4}-\\d{2}-\\d{2})?\\s*$`,
    'mu',
  );
  const match = heading.exec(changelog);
  if (!match) throw new Error(`CHANGELOG.md has no release section for ${version}.`);
  const start = match.index + match[0].length;
  const remaining = changelog.slice(start);
  const next = /^## /mu.exec(remaining);
  const notes = remaining.slice(0, next ? next.index : undefined).trim();
  if (!notes) throw new Error(`CHANGELOG.md has no release notes for ${version}.`);
  return notes + '\n';
}

export async function checkRelease(root, tag) {
  const { pkg } = await validateProject(root);
  if (stableVersion(tag) !== pkg.version) {
    throw new Error('The release tag must exactly match manifest.version, without a prefix.');
  }
  return releaseNotes(await readFile(resolve(root, 'CHANGELOG.md'), 'utf8'), tag);
}

export async function prepareRelease(
  root,
  version,
  { date = new Date().toISOString().slice(0, 10) } = {},
) {
  stableVersion(version);
  const releaseDate = new Date(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(date) ||
    Number.isNaN(releaseDate.getTime()) ||
    releaseDate.toISOString().slice(0, 10) !== date
  ) {
    throw new Error('The release date must be a real YYYY-MM-DD calendar date.');
  }
  const { pkg, lock, manifest, versions } = await validateProject(root);
  if (compareVersions(version, pkg.version) < 0) {
    throw new Error('The release version must not be lower than the current version.');
  }
  const path = resolve(root, 'CHANGELOG.md');
  const changelog = await readFile(path, 'utf8');
  const duplicate = new RegExp(`^## \\[${version.replaceAll('.', '\\.')}\\](?: - |\\s*$)`, 'mu');
  if (duplicate.test(changelog)) throw new Error(`Release ${version} is already in CHANGELOG.md.`);
  const unreleased = /^## \[Unreleased\][ \t]*\r?$/mu.exec(changelog);
  if (!unreleased) throw new Error('CHANGELOG.md needs an [Unreleased] section.');
  const start = unreleased.index + unreleased[0].length;
  const remaining = changelog.slice(start);
  const next = /^## /mu.exec(remaining);
  if (!remaining.slice(0, next ? next.index : undefined).trim()) {
    throw new Error('The [Unreleased] section must describe the changes being released.');
  }
  const updated =
    changelog.slice(0, unreleased.index) +
    `## [Unreleased]\n\n## [${version}] - ${date}` +
    remaining;
  pkg.version = version;
  lock.version = version;
  lock.packages[''].version = version;
  manifest.version = version;
  versions[version] = manifest.minAppVersion;
  const files = {
    'package.json': json(pkg),
    'package-lock.json': json(lock),
    'manifest.json': json(manifest),
    'versions.json': json(versions),
    'CHANGELOG.md': updated,
  };
  for (const [name, content] of Object.entries(files))
    await writeFile(resolve(root, name), content);
}

async function main(args) {
  const [command, version, output, ...extra] = args;
  if (command === 'validate' && args.length === 1) {
    const { pkg } = await validateProject();
    console.log(`Project metadata is consistent: ${pkg.version}`);
    return;
  }
  if (command === 'prepare' && args.length === 2) {
    await prepareRelease(projectRoot, version);
    console.log(`Prepared ${version}. Review and commit the changes before creating a tag.`);
    return;
  }
  if (command === 'check' && args.length === 2) {
    await checkRelease(projectRoot, version);
    console.log(`Release metadata and notes match ${version}.`);
    return;
  }
  if (command === 'notes' && args.length === 3 && !extra.length) {
    const notes = await checkRelease(projectRoot, version);
    await writeFile(resolve(output), notes);
    return;
  }
  throw new Error(
    'Usage: release-project.mjs validate | prepare <version> | check <tag> | notes <tag> <output-file>',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
