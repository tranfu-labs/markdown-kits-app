import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __lastClipboardHtml?: string;
    __lastClipboardText?: string;
  }
}

const articleMarkdown = [
  '# E2E 回归文章',
  '',
  '正文段落用于验证预览、历史和复制。',
  '',
  '| 能力 | 状态 |',
  '| --- | --- |',
  '| 复制 | 已覆盖 |',
  '',
  '```ts',
  'const value = 1;',
  '```'
].join('\n');

async function installClipboardMock(page: Page) {
  await page.addInitScript(() => {
    class MockClipboardItem {
      readonly data: Record<string, Blob>;
      readonly types: string[];

      constructor(data: Record<string, Blob>) {
        this.data = data;
        this.types = Object.keys(data);
      }

      async getType(type: string) {
        return this.data[type];
      }
    }

    Object.defineProperty(window, 'ClipboardItem', {
      configurable: true,
      value: MockClipboardItem
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        async write(items: Array<{ getType: (type: string) => Promise<Blob>; types: string[] }>) {
          const item = items[0];
          const htmlBlob = item.types.includes('text/html') ? await item.getType('text/html') : undefined;
          const textBlob = item.types.includes('text/plain') ? await item.getType('text/plain') : undefined;
          window.__lastClipboardHtml = htmlBlob ? await htmlBlob.text() : '';
          window.__lastClipboardText = textBlob ? await textBlob.text() : '';
        },
        async writeText(text: string) {
          window.__lastClipboardText = text;
        },
        async readText() {
          return window.__lastClipboardText || '';
        }
      }
    });
  });
}

test.beforeEach(async ({ page }) => {
  await installClipboardMock(page);
});

test('desktop editor flow previews, switches theme, saves history, and copies HTML', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await page.getByTestId('markdown-input').fill(articleMarkdown);
  await page.getByPlaceholder('搜索主题').fill('技术');
  await page.getByLabel('主题分类').selectOption('技术');
  await expect(page.getByRole('button', { name: '技术蓝图' })).toBeVisible();
  await page.getByRole('button', { name: '技术蓝图' }).click();

  await expect(page.getByTestId('preview')).toContainText('E2E 回归文章');
  await expect(page.locator('.theme-name')).toHaveText('技术蓝图');

  const htmlDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'HTML' }).click();
  const htmlDownload = await htmlDownloadPromise;
  expect(htmlDownload.suggestedFilename()).toMatch(/\.html$/);

  const pdfPopupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'PDF' }).click();
  const pdfPopup = await pdfPopupPromise;
  await expect(pdfPopup.locator('.mk-print-page')).toContainText('E2E 回归文章');
  await pdfPopup.close();

  const cardDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '卡片' }).click();
  const cardDownload = await cardDownloadPromise;
  expect(cardDownload.suggestedFilename()).toMatch(/\.png$/);

  await page.getByRole('button', { name: /^保存$/ }).click();
  await page.getByRole('button', { name: '历史' }).click();
  await expect(page.locator('.side-panel')).toContainText('E2E 回归文章');
  await page.locator('.side-panel').getByLabel('关闭历史记录').click();

  await page.getByRole('button', { name: '复制到公众号' }).click();
  await expect(page.getByText('已复制到剪贴板')).toBeVisible();

  const clipboardHtml = await page.evaluate(() => window.__lastClipboardHtml || '');
  expect(clipboardHtml).toContain('E2E 回归文章');
  expect(clipboardHtml).toContain('mk-rendered-article');
  expect(clipboardHtml).toContain('code-frame');
});

test('mobile editor viewport has no horizontal overflow and key controls are clickable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: '主题管理' }).click();
  await expect(page.getByRole('heading', { name: '主题管理' })).toBeVisible();
  await page.getByRole('button', { name: '关闭主题管理' }).click();

  await page.getByRole('button', { name: '预览' }).click();
  await page.getByRole('button', { name: '历史' }).click();
  await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible();
  await page.locator('.side-panel').getByLabel('关闭历史记录').click();

  const hasNoHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(hasNoHorizontalOverflow).toBe(true);
});

test('editor imports markdown and handles rich text and image paste', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await page.locator('input[type="file"][accept*=".md"]').setInputFiles({
    name: 'upload.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# Uploaded MD\n\nfrom file')
  });
  await expect(page.getByTestId('markdown-input')).toHaveValue(/Uploaded MD/);

  await page.getByTestId('markdown-input').fill('');
  await page.getByTestId('markdown-input').focus();
  await page.evaluate(() => {
    const textarea = document.querySelector('[data-testid="markdown-input"]')!;
    const data = new DataTransfer();
    data.setData('text/html', '<h1>Rich Paste</h1><p>Plain text paragraph</p>');
    data.setData('text/plain', 'Rich Paste Plain text paragraph');
    textarea.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
  });
  await expect(page.getByTestId('markdown-input')).toHaveValue(/Rich Paste/);
  await expect(page.getByTestId('markdown-input')).toHaveValue(/Plain text paragraph/);

  await page.getByTestId('markdown-input').fill('');
  await page.getByTestId('markdown-input').focus();
  await page.evaluate(() => {
    const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='), (char) => char.charCodeAt(0));
    const file = new File([bytes], 'pasted.png', { type: 'image/png' });
    const data = new DataTransfer();
    data.items.add(file);
    const textarea = document.querySelector('[data-testid="markdown-input"]')!;
    textarea.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
  });
  await expect(page.getByTestId('markdown-input')).toHaveValue(/!\[pasted]\(local-img:\/\/img-/);
});

test('history can export, clear, and import records', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const title = `E2E 导入导出 ${Date.now()}`;
  await page.getByTestId('markdown-input').fill(`# ${title}\n\n历史导入导出正文。`);
  await page.getByRole('button', { name: /^保存$/ }).click();
  await page.getByRole('button', { name: '历史' }).click();
  await expect(page.locator('.side-panel')).toContainText(title);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('.history-tools').getByRole('button', { name: '导出', exact: true }).click();
  const download = await downloadPromise;
  const exportPath = await download.path();
  expect(exportPath).toBeTruthy();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '清空' }).click();
  await expect(page.locator('.side-panel')).not.toContainText(title);

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('.history-tools').getByText('导入').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(exportPath!);

  await expect(page.locator('.side-panel')).toContainText(title);
});

test('share flow creates a short link, renders it, and deletes it from admin', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const title = `E2E 分享 ${Date.now()}`;
  await page.getByTestId('markdown-input').fill(`# ${title}\n\n分享内容正文。`);
  await page.getByRole('button', { name: /^分享$/ }).click();

  const shareInput = page.getByTestId('share-url-input');
  await expect(shareInput).toHaveValue(/\/s\//);
  const sharePath = new URL(await shareInput.inputValue()).pathname;

  await page.goto(sharePath);
  await expect(page.locator('.shared-article')).toContainText(title);

  await page.goto('/list');
  await page.getByPlaceholder('列表密码').fill('dev-password');
  await page.getByRole('button', { name: '加载列表' }).click();
  await page.getByPlaceholder('搜索 ID 或标题').fill(title);
  await page.getByRole('button', { name: '搜索' }).click();

  const row = page.getByRole('row').filter({ hasText: title });
  await expect(row).toBeVisible();
  await row.getByRole('checkbox', { name: /选择分享/ }).check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '批量删除' }).click();
  await expect(row).toHaveCount(0);

  await page.goto(sharePath);
  await expect(page.getByText('分享不存在')).toBeVisible();
});

test('mobile admin list can search and batch delete without page overflow', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const title = `E2E 移动管理 ${Date.now()}`;
  const created = await request.post('/api/share', {
    data: {
      content: `# ${title}\n\n移动端管理列表正文。`,
      style: 'classic-ink'
    }
  });
  expect(created.ok()).toBe(true);
  const { id } = (await created.json()) as { id: string };

  await page.goto('/list');
  await page.getByPlaceholder('列表密码').fill('dev-password');
  await page.getByRole('button', { name: '加载列表' }).click();
  await page.getByPlaceholder('搜索 ID 或标题').fill(title);
  await page.getByRole('button', { name: '搜索' }).click();

  const row = page.getByRole('row').filter({ hasText: title });
  await expect(row).toBeVisible();
  const hasNoHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(hasNoHorizontalOverflow).toBe(true);

  await row.getByRole('checkbox', { name: /选择分享/ }).check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '批量删除' }).click();
  await expect(row).toHaveCount(0);

  const missing = await request.get(`/api/share/${id}`);
  expect(missing.status()).toBe(404);
});
