import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('render markdown CLI', () => {
  it('renders markdown through the shared render core', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'markdown-kits-cli-'));
    try {
      const input = path.join(dir, 'article.md');
      const output = path.join(dir, 'article.html');
      await writeFile(input, '# CLI Render\n\n| A | B |\n| --- | --- |\n| 1 | 2 |');

      await execFileAsync(process.execPath, [
        path.resolve('node_modules/tsx/dist/cli.mjs'),
        path.resolve('scripts/render-markdown.ts'),
        '--input',
        input,
        '--output',
        output,
        '--theme',
        'classic-ink'
      ]);

      const html = await readFile(output, 'utf8');
      expect(html).toContain('<!doctype html>');
      expect(html).toContain('CLI Render');
      expect(html).toContain('mk-rendered-article');
      expect(html).toContain('mk-table-wrap');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
