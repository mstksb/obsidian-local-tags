import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../../', import.meta.url));
const result = await build({
  stdin: {
    contents: [
      "export {CurrentDocumentController} from './src/services/controller.ts';",
      "export {PrivateTagSuggest} from './src/suggest.ts';",
      "export {PrivateTagView} from './src/views.ts';",
      "export {default as LocalTagsPlugin} from './src/main.ts';",
      "export {normalizeSettings} from './src/settings.ts';",
      "export {decorateReading,clearReading} from './src/reading.ts';",
      "export {editorExtension} from './src/editor/extension.ts';",
      "export {EditorState} from '@codemirror/state';",
      "export {EditorView} from '@codemirror/view';",
      "export {MarkdownView,FileView,TFile,Setting} from 'obsidian';",
    ].join('\n'),
    resolveDir: project,
  },
  alias: {
    obsidian: fileURLToPath(new URL('./obsidian-stub.mjs', import.meta.url)),
  },
  define: { __DEBUG__: 'false' },
  bundle: true,
  loader: { '.svg': 'text' },
  platform: 'node',
  format: 'esm',
  write: false,
});

export const fixture = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`
);

export const file = (path) => new fixture.TFile(path);

export function app(read = async () => '') {
  return {
    vault: {
      cachedRead: read,
      getName: () => 'Example Vault',
      on: () => ({}),
      getFileByPath: (path) => file(path),
    },
    metadataCache: { getFileCache: () => ({ tags: [] }) },
    workspace: {
      on: () => ({}),
      onLayoutReady: () => {},
      detachLeavesOfType: () => {},
    },
  };
}
