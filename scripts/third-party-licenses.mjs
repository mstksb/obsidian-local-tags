import { readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const mitTerms = `Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.`;

async function packageFor(input, root) {
  let directory = dirname(await realpath(resolve(root, input)));
  while (directory !== dirname(directory)) {
    try {
      const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
      if (pkg.name && pkg.version) return { directory, pkg };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    directory = dirname(directory);
  }
  throw new Error(`Cannot identify bundled package: ${input}`);
}

/** Use the actual bundle graph, including indirect dependencies and retained code. */
export async function thirdPartyNotices(metafile, root) {
  const packages = new Map();
  for (const output of Object.values(metafile.outputs))
    for (const [input, contribution] of Object.entries(output.inputs)) {
      if (!contribution.bytesInOutput || !input.includes('node_modules/')) continue;
      const entry = await packageFor(input, root);
      packages.set(`${entry.pkg.name}@${entry.pkg.version}`, entry);
    }
  const sections = [];
  for (const [id, { directory, pkg }] of [...packages].sort(([a], [b]) =>
    a.localeCompare(b, 'en'),
  )) {
    const license = pkg.license ?? pkg.licenses?.map((item) => item.type).join(' OR ');
    // A new license needs an explicit review instead of silently emitting incomplete notices.
    if (license !== 'MIT') throw new Error(`Unreviewed bundled license: ${id}: ${license}`);
    const files = (await readdir(directory))
      .filter((name) => /^(licen[sc]e|copying)(\.|$)/iu.test(name))
      .sort();
    let text;
    if (files.length) {
      text = (await Promise.all(files.map((name) => readFile(join(directory, name), 'utf8')))).join(
        '\n\n',
      );
      if (!/Permission is hereby granted/iu.test(text) || !/copyright notice/iu.test(text))
        throw new Error(`Incomplete MIT license: ${id}`);
    } else if (id === 'format@0.2.2') {
      // This version declares MIT in `licenses` and links its text in Readme.md.
      // Preserve the shipped source and README attribution; no network fetch at build time.
      const source = await readFile(join(directory, 'format.js'), 'utf8');
      const readme = await readFile(join(directory, 'Readme.md'), 'utf8');
      if (
        !source.includes('Copyright 2010 - 2013 Sami Samhuri') ||
        !readme.includes('Copyright 2010 - 2014 Sami Samhuri') ||
        !readme.includes('MIT license')
      )
        throw new Error(`License override no longer matches: ${id}`);
      text = `MIT License\n\nCopyright 2010 - 2013 Sami Samhuri <sami@samhuri.net>\nCopyright 2010 - 2014 Sami Samhuri <sami@samhuri.net>\n\n${mitTerms}`;
    } else throw new Error(`Missing license text: ${id}`);
    sections.push(`${id}\n${'='.repeat(id.length)}\n${text.trim().replace(/\r\n/gu, '\n')}`);
  }
  return `Third-party software included in main.js\n\n${sections.join('\n\n')}\n`;
}

/** Include both licenses for installers that download only the runtime files. */
export function licensePlugin(root, output) {
  return {
    name: 'third-party-licenses',
    setup(builder) {
      builder.onEnd(async (result) => {
        if (result.errors.length || !result.metafile) return;
        const notices = await thirdPartyNotices(result.metafile, root);
        const license = await readFile(join(root, 'LICENSE'), 'utf8');
        const script = join(output, 'main.js');
        const code = await readFile(script, 'utf8');
        await writeFile(
          script,
          `${code}\n/*!\nLocal Tags license (GPL-3.0-only)\n\n${license.replaceAll('*/', '* /')}*/\n/*!\n${notices.replaceAll('*/', '* /')}*/\n`,
        );
        await writeFile(join(output, 'THIRD-PARTY-NOTICES.txt'), notices);
      });
    },
  };
}
