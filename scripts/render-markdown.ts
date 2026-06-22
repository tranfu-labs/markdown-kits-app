import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { defaultThemeId } from '../src/styles/themes';

type CliOptions = {
  input?: string;
  output?: string;
  theme: string;
  fragment: boolean;
};

function usage() {
  return [
    'Usage: npm run render:markdown -- --input article.md --output article.html [--theme classic-ink] [--fragment]',
    '',
    'Options:',
    '  --input     Markdown file to render',
    '  --output    HTML file to write',
    '  --theme     Theme id, defaults to classic-ink',
    '  --fragment  Write only the rendered article fragment'
  ].join('\n');
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { theme: defaultThemeId, fragment: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--input') options.input = argv[++index];
    else if (arg === '--output') options.output = argv[++index];
    else if (arg === '--theme') options.theme = argv[++index] || defaultThemeId;
    else if (arg === '--fragment') options.fragment = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!options.input || !options.output) {
    throw new Error('Both --input and --output are required');
  }
  return options;
}

function installDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    DOMParser: dom.window.DOMParser,
    Element: dom.window.Element,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    SVGElement: dom.window.SVGElement
  });
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: dom.window.navigator
  });
}

function wrapDocument(articleHtml: string) {
  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Markdown Kits Render</title>',
    '</head>',
    '<body>',
    articleHtml,
    '</body>',
    '</html>'
  ].join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  installDom();
  const { renderMarkdown } = await import('../src/lib/render');
  const markdown = await readFile(path.resolve(options.input!), 'utf8');
  const articleHtml = await renderMarkdown(markdown, options.theme);
  await writeFile(path.resolve(options.output!), options.fragment ? articleHtml : wrapDocument(articleHtml));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  console.error(usage());
  process.exit(1);
});
