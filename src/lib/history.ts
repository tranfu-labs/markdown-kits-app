import type { HistoryArticle } from '../types';

const historyKey = 'mk.articleHistory';
const currentKey = 'mk.markdownInput';
const styleKey = 'mk.currentStyle';

export function extractTitle(markdown: string) {
  const title = markdown.match(/^#{1,6}\s+(.+)$/m)?.[1]?.trim();
  if (title) return title.replace(/[*_`~]/g, '').slice(0, 60);
  const clean = markdown
    .replace(/^!\[.*?\]\(.*?\)$/gm, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .trim();
  return clean ? `${clean.slice(0, 24)}${clean.length > 24 ? '...' : ''}` : '无标题';
}

export function loadHistory(): HistoryArticle[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(historyKey) || '[]') as HistoryArticle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: HistoryArticle[]) {
  try {
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
    return true;
  } catch {
    return false;
  }
}

export function upsertHistory(
  history: HistoryArticle[],
  content: string,
  style: string,
  currentId: string | null
) {
  const now = Date.now();
  const title = extractTitle(content);
  const existingIndex = currentId ? history.findIndex((item) => item.id === currentId) : -1;

  if (existingIndex >= 0) {
    const next = [...history];
    const existing = next.splice(existingIndex, 1)[0];
    next.unshift({ ...existing, title, content, style, updatedAt: now });
    return { history: next, id: existing.id, saved: saveHistory(next) };
  }

  const id = `article-${now}-${Math.random().toString(36).slice(2, 8)}`;
  const next: HistoryArticle[] = [
    { id, title, content, style, createdAt: now, updatedAt: now },
    ...history
  ].slice(0, 20);
  return { history: next, id, saved: saveHistory(next) };
}

export function loadDraft(defaultContent: string, defaultStyle: string) {
  try {
    return {
      content: localStorage.getItem(currentKey) || defaultContent,
      style: localStorage.getItem(styleKey) || defaultStyle
    };
  } catch {
    return { content: defaultContent, style: defaultStyle };
  }
}

export function saveDraft(content: string, style: string) {
  try {
    localStorage.setItem(currentKey, content);
    localStorage.setItem(styleKey, style);
    return true;
  } catch {
    return false;
  }
}
