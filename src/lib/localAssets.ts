import type { HistoryArticle } from '../types';
import type { StoredImageMetadata } from './imageStore';

export type HistoryExportPayload = {
  version: 1;
  exportedAt: string;
  articles: HistoryArticle[];
};

export function createHistoryExport(history: HistoryArticle[]) {
  const payload: HistoryExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    articles: history
  };
  return JSON.stringify(payload, null, 2);
}

function isHistoryArticle(value: unknown): value is HistoryArticle {
  if (!value || typeof value !== 'object') return false;
  const article = value as HistoryArticle;
  return (
    typeof article.id === 'string' &&
    typeof article.title === 'string' &&
    typeof article.content === 'string' &&
    typeof article.style === 'string' &&
    Number.isFinite(article.createdAt) &&
    Number.isFinite(article.updatedAt)
  );
}

export function parseHistoryImport(raw: string) {
  const parsed = JSON.parse(raw) as { articles?: unknown } | unknown[];
  const articles = Array.isArray(parsed) ? parsed : parsed?.articles;
  if (!Array.isArray(articles)) {
    throw new Error('历史文件格式不正确');
  }
  if (!articles.every(isHistoryArticle)) {
    throw new Error('历史文件内容不完整');
  }
  return articles.slice(0, 20);
}

export function markdownFileName(title: string) {
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim() || 'markdown-kits';
  return `${safeTitle.slice(0, 50)}.md`;
}

export function collectLocalImageIds(markdown: string) {
  return Array.from(markdown.matchAll(/!\[[^\]]*]\(local-img:\/\/([^)]+)\)/g), (match) => match[1]);
}

export function collectReferencedLocalImageIds(draft: string, history: HistoryArticle[]) {
  const referenced = new Set(collectLocalImageIds(draft));
  history.forEach((article) => {
    collectLocalImageIds(article.content).forEach((id) => referenced.add(id));
  });
  return referenced;
}

export function findOrphanImages(images: StoredImageMetadata[], referenced: Set<string>) {
  return images.filter((image) => !referenced.has(image.id));
}

export function summarizeImages(images: StoredImageMetadata[]) {
  return images.reduce(
    (summary, image) => ({
      count: summary.count + 1,
      bytes: summary.bytes + image.compressedSize
    }),
    { count: 0, bytes: 0 }
  );
}
