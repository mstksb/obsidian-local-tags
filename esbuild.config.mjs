import { builtinModules } from 'node:module';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { validateProject } from './scripts/release-project.mjs';
import { licensePlugin } from './scripts/third-party-licenses.mjs';

const projectRoot = fileURLToPath(new URL('./', import.meta.url));

export async function buildProject(root = projectRoot) {
  const { pkg, manifest } = await validateProject(root);
  const output = resolve(root, 'dist/local-tags');
  await mkdir(output, { recursive: true });
  const result = await build({
    absWorkingDir: root,
    entryPoints: ['src/main.ts'],
    outfile: resolve(output, 'main.js'),
    define: { __DEBUG__: 'false' },
    bundle: true,
    loader: { '.svg': 'text' },
    format: 'cjs',
    target: 'es2022',
    external: ['obsidian', 'electron', '@codemirror/*', '@lezer/*', ...builtinModules],
    sourcemap: false,
    minify: true,
    metafile: true,
    banner: {
      js: `/*! Local Tags ${manifest.version} | Copyright (C) 2026 ${pkg.author} | GPL-3.0-only | See LICENSE and the corresponding source at https://github.com/mstksb/obsidian-local-tags/tree/${manifest.version} */`,
    },
    plugins: [licensePlugin(root, output)],
  });
  for (const name of ['manifest.json', 'styles.css', 'LICENSE']) {
    await copyFile(resolve(root, name), resolve(output, name));
  }
  await writeFile(
    resolve(output, 'metafile.json'),
    JSON.stringify(result.metafile, null, 2) + '\n',
  );
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await buildProject();
}
