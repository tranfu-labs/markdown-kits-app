import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixCjkSpacing } from '../src/lib/autocorrect';
import { ImageStore } from '../src/lib/imageStore';
import { applyThemeStyles, prepareClipboardHtml, preprocessMarkdown, renderMarkdown } from '../src/lib/render';
import { extractTitle, saveDraft, saveHistory, upsertHistory } from '../src/lib/history';
import {
  collectReferencedLocalImageIds,
  createHistoryExport,
  findOrphanImages,
  markdownFileName,
  parseHistoryImport,
  summarizeImages
} from '../src/lib/localAssets';
import type { HistoryArticle } from '../src/types';

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock('mermaid');
  document.body.innerHTML = '';
});

describe('render core', () => {
  it('normalizes broken markdown copied from rich editors', () => {
    expect(preprocessMarkdown('- item\n: value')).toContain('- item: value');
    expect(preprocessMarkdown('* * *')).toBe('***');
  });

  it('fixes CJK spacing without breaking markdown links', () => {
    const fixed = fixCjkSpacing('中文English和[链接Text](https://example.com)');
    expect(fixed).toBe('中文 English 和[链接Text](https://example.com)');
  });

  it('applies inline article styles and table wrappers', () => {
    const html = applyThemeStyles('<h1>Hello</h1><section class="mk-table-wrap"><table><tr><td>A</td></tr></table></section>', 'classic-ink');
    expect(html).toContain('mk-rendered-article');
    expect(html).toContain('overflow-x:auto');
    expect(html).toContain('border-bottom');
  });

  it('renders the core article fixture set', async () => {
    const store = new ImageStore();
    vi.spyOn(store, 'getObjectUrl').mockResolvedValue(null);

    const html = await renderMarkdown(
      [
        '# 标题',
        '',
        '正文段落和 **重点**。',
        '',
        '> 引用内容',
        '',
        '| 能力 | 状态 |',
        '| --- | --- |',
        '| 表格 | 已覆盖 |',
        '',
        '```ts',
        'const answer = 42;',
        '```',
        '',
        '```mermaid',
        'graph TD',
        '  A-->B',
        '```',
        '',
        '![one](https://example.com/one.png)',
        '![two](https://example.com/two.png)',
        '',
        '![missing](local-img://missing-id)'
      ].join('\n'),
      'classic-ink',
      store
    );

    expect(html).toContain('<h1');
    expect(html).toContain('正文段落');
    expect(html).toContain('<blockquote');
    expect(html).toContain('mk-table-wrap');
    expect(html).toContain('code-frame');
    expect(html).toContain('class="mermaid"');
    expect(html).toContain('class="image-grid"');
    expect(html).toContain('data-image-id="missing-id"');
    expect(html).toContain('data:image/svg+xml');
  });

  it('extracts a stable history title', () => {
    expect(extractTitle('# **Title**')).toBe('Title');
    expect(extractTitle('plain content body')).toBe('plain content body');
  });

  it('reports localStorage write failures instead of throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect(saveDraft('draft', 'classic-ink')).toBe(false);
    expect(saveHistory([])).toBe(false);
    expect(upsertHistory([], '# Title', 'classic-ink', null).saved).toBe(false);
  });

  it('caches and revokes local image object URLs', async () => {
    const createObjectUrl = vi.fn(() => 'blob:cached-url');
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectUrl, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectUrl, configurable: true });

    const store = new ImageStore();
    vi.spyOn(store, 'getBlob').mockResolvedValue(new Blob(['image']));

    await expect(store.getObjectUrl('img-1')).resolves.toBe('blob:cached-url');
    await expect(store.getObjectUrl('img-1')).resolves.toBe('blob:cached-url');
    expect(createObjectUrl).toHaveBeenCalledTimes(1);

    store.dispose();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:cached-url');
  });

  it('preserves rendered mermaid SVG when preparing clipboard HTML', async () => {
    const prepared = await prepareClipboardHtml(
      '<div class="mk-rendered-article"><div class="mermaid" data-processed="true"><svg viewBox="0 0 10 10"><path d="M0 0h10"/></svg></div></div>'
    );
    expect(prepared.html).toContain('<svg');
    expect(prepared.text).not.toContain('graph TD');
  });

  it('converts image grids to table markup for clipboard compatibility', async () => {
    const html = applyThemeStyles(
      [
        '<p><img src="https://example.com/one.png" alt="one"></p>',
        '<p><img src="https://example.com/two.png" alt="two"></p>'
      ].join(''),
      'classic-ink'
    );

    const prepared = await prepareClipboardHtml(html);

    expect(prepared.html).not.toContain('image-grid');
    expect(prepared.html).toContain('<table');
    expect(prepared.html).toContain('<td');
    expect(prepared.html).toContain('https://example.com/one.png');
    expect(prepared.html).toContain('https://example.com/two.png');
  });

  it('rewrites local clipboard images to data URLs', async () => {
    const store = new ImageStore();
    vi.spyOn(store, 'getBlob').mockResolvedValue(new Blob(['local-image'], { type: 'image/png' }));

    const prepared = await prepareClipboardHtml('<img data-image-id="img-1" src="blob:local-preview" alt="local">', store);

    expect(prepared.html).toContain('data:image/png;base64');
    expect(prepared.html).not.toContain('blob:local-preview');
  });

  it('skips loading Mermaid when the page has no Mermaid blocks', async () => {
    vi.resetModules();
    const loadMermaid = vi.fn();
    vi.doMock('mermaid', () => {
      loadMermaid();
      return {
        default: {
          initialize: vi.fn(),
          run: vi.fn()
        }
      };
    });
    const { renderMermaidBlocks } = await import('../src/lib/mermaidBlocks');

    document.body.innerHTML = '<main><p>No diagrams here.</p></main>';
    await renderMermaidBlocks('.mermaid');

    expect(loadMermaid).not.toHaveBeenCalled();
  });
});

describe('local content assets', () => {
  const article: HistoryArticle = {
    id: 'article-1',
    title: 'A:/Title?',
    content: '# A\n\n![kept](local-img://img-kept)',
    style: 'classic-ink',
    createdAt: 1,
    updatedAt: 2
  };

  it('exports and imports validated history JSON', () => {
    const exported = createHistoryExport([article]);
    expect(parseHistoryImport(exported)).toEqual([article]);
    expect(() => parseHistoryImport('{"items":[]}')).toThrow(/格式/);
    expect(() => parseHistoryImport('{"articles":[{"id":"x"}]}')).toThrow(/不完整/);
  });

  it('creates safe markdown filenames', () => {
    expect(markdownFileName(article.title)).toBe('A Title.md');
    expect(markdownFileName('')).toBe('markdown-kits.md');
  });

  it('keeps referenced images out of orphan cleanup', () => {
    const referenced = collectReferencedLocalImageIds('![draft](local-img://img-draft)', [article]);
    const images = [
      { id: 'img-draft', name: 'draft', createdAt: 1, originalSize: 10, compressedSize: 6, mimeType: 'image/png' },
      { id: 'img-kept', name: 'kept', createdAt: 2, originalSize: 20, compressedSize: 12, mimeType: 'image/png' },
      { id: 'img-orphan', name: 'orphan', createdAt: 3, originalSize: 30, compressedSize: 18, mimeType: 'image/png' }
    ];

    expect(findOrphanImages(images, referenced).map((image) => image.id)).toEqual(['img-orphan']);
    expect(summarizeImages(images)).toEqual({ count: 3, bytes: 36 });
  });
});
