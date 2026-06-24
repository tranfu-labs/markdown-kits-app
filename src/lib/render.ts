import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import DOMPurify from 'dompurify';
import { themeMap, defaultThemeId } from '../styles/themes';
import type { Theme } from '../types';
import type { ImageStore } from './imageStore';
import { blobToDataUrl } from './imageStore';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('text', plaintext);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);

const mermaidLanguages = new Set([
  'mermaid',
  'flowchart',
  'graph',
  'sequenceDiagram',
  'gantt',
  'classDiagram',
  'stateDiagram',
  'erDiagram',
  'journey',
  'pie',
  'gitGraph'
]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlightCode(source: string, lang: string) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(source, { language: lang }).value;
    } catch {
      return escapeHtml(source);
    }
  }

  return escapeHtml(source);
}

function renderCodeFrame(source: string, lang = '') {
  const language = lang.trim().split(/\s+/)[0] || '';
  const highlighted = highlightCode(source, language);

  return [
    '<div class="code-frame" style="margin:22px 0;border-radius:12px;overflow:hidden;background:#383a42;box-shadow:0 2px 10px rgba(0,0,0,0.16)">',
    '<div class="code-dots" style="display:flex;align-items:center;gap:7px;padding:11px 13px;background:#2a2c33;border-bottom:1px solid #1f2128">',
    '<span style="width:12px;height:12px;border-radius:50%;background:#ff5f56;display:inline-block"></span>',
    '<span style="width:12px;height:12px;border-radius:50%;background:#ffbd2e;display:inline-block"></span>',
    '<span style="width:12px;height:12px;border-radius:50%;background:#27c93f;display:inline-block"></span>',
    '</div>',
    '<pre style="margin:0;padding:18px;overflow-x:auto;background:#383a42;line-height:1.65"><code style="display:block;margin:0;padding:0;background:transparent !important;color:#abb2bf !important;border:0;font-family:&quot;SF Mono&quot;,Monaco,&quot;Cascadia Code&quot;,Consolas,monospace;font-size:14px;line-height:1.65;white-space:pre">',
    highlighted,
    '</code></pre>',
    '</div>\n'
  ].join('');
}

export function preprocessMarkdown(content: string) {
  let processed = String(content || '').replace(/\uE200cite\uE202[^\uE201]*\uE201/g, '');
  processed = processed.replace(/^[ ]{0,3}(\*[ ]*\*[ ]*\*[\* ]*)[ \t]*$/gm, '***');
  processed = processed.replace(/^[ ]{0,3}(-[ ]*-[ ]*-[- ]*)[ \t]*$/gm, '---');
  processed = processed.replace(/^[ ]{0,3}(_[ ]*_[ ]*_[_ ]*)[ \t]*$/gm, '___');
  processed = processed.replace(/\*\*\s+\*\*/g, ' ');
  processed = processed.replace(/\*{4,}/g, '');
  processed = processed.replace(/__\s+__/g, ' ');
  processed = processed.replace(/_{4,}/g, '');
  processed = processed.replace(/^(\s*(?:\d+\.|-|\*)\s+[^:\n]+)\n\s*:\s*(.+?)$/gm, '$1: $2');
  processed = processed.replace(/^(\s*(?:\d+\.|-|\*)\s+.+?:)\s*\n\s+(.+?)$/gm, '$1 $2');
  return processed;
}

export function createMarkdownParser() {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false
  });

  md.renderer.rules.fence = (tokens, index) => {
    const token = tokens[index];
    const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
    const lang = info.split(/\s+/)[0] || '';
    if (lang && mermaidLanguages.has(lang)) {
      return `<div class="mermaid">${escapeHtml(token.content)}</div>\n`;
    }

    return renderCodeFrame(token.content, lang);
  };
  md.renderer.rules.code_block = (tokens, index) => renderCodeFrame(tokens[index].content);
  md.renderer.rules.table_open = () => '<section class="mk-table-wrap"><table>';
  md.renderer.rules.table_close = () => '</table></section>';
  return md;
}

const parser = createMarkdownParser();

function sanitize(html: string) {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['section'],
    ADD_ATTR: ['style', 'class', 'data-image-id', 'data-columns', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data|blob):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
  });
}

function placeholder(label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" rx="8" fill="#f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="16">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function resolveLocalImages(html: string, imageStore?: ImageStore) {
  if (!imageStore) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const images = Array.from(doc.querySelectorAll('img'));

  for (const img of images) {
    const src = img.getAttribute('src') || '';
    if (!src.startsWith('local-img://')) continue;

    const id = src.replace('local-img://', '');
    const objectUrl = await imageStore.getObjectUrl(id);
    img.setAttribute('src', objectUrl || placeholder('图片丢失'));
    img.setAttribute('data-image-id', id);
  }

  return doc.body.innerHTML;
}

function groupConsecutiveImages(doc: Document) {
  const children = Array.from(doc.body.children);
  const imageItems: Array<{ element: Element; img: HTMLImageElement; index: number }> = [];

  children.forEach((child, index) => {
    if (child.tagName === 'P') {
      const images = Array.from(child.querySelectorAll('img'));
      images.forEach((img) => imageItems.push({ element: child, img, index }));
    } else if (child.tagName === 'IMG') {
      imageItems.push({ element: child, img: child as HTMLImageElement, index });
    }
  });

  const groups: typeof imageItems[] = [];
  let current: typeof imageItems = [];
  imageItems.forEach((item, index) => {
    const previous = imageItems[index - 1];
    if (!previous || item.index === previous.index || item.index - previous.index === 1) {
      current.push(item);
    } else {
      groups.push(current);
      current = [item];
    }
  });
  if (current.length) groups.push(current);

  for (const group of groups) {
    if (group.length < 2) continue;
    const columns = group.length === 2 || group.length === 4 ? 2 : 3;
    const grid = doc.createElement('div');
    grid.className = 'image-grid';
    grid.setAttribute('data-columns', String(columns));
    grid.setAttribute(
      'style',
      `display:grid;grid-template-columns:repeat(${columns},1fr);gap:8px;margin:20px auto;max-width:100%;align-items:start`
    );

    for (const item of group) {
      const wrapper = doc.createElement('div');
      wrapper.setAttribute('style', 'width:100%;overflow:hidden');
      const cloned = item.img.cloneNode(true) as HTMLImageElement;
      cloned.setAttribute('style', 'width:100%;height:auto;display:block;border-radius:8px');
      wrapper.appendChild(cloned);
      grid.appendChild(wrapper);
    }

    const first = group[0].element;
    first.parentNode?.insertBefore(grid, first);
    new Set(group.map((item) => item.element)).forEach((element) => element.remove());
  }
}

export function applyThemeStyles(html: string, themeId: string) {
  const theme = themeMap[themeId] || themeMap[defaultThemeId];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  groupConsecutiveImages(doc);

  Object.entries(theme.styles).forEach(([selector, style]) => {
    if (selector === 'container') return;
    doc.querySelectorAll(selector).forEach((element) => {
      if (element.tagName === 'IMG' && element.closest('.image-grid')) return;
      if ((selector === 'pre' || selector === 'code') && element.closest('.code-frame')) return;
      const existing = element.getAttribute('style') || '';
      element.setAttribute('style', `${existing}; ${style}`.trim());
    });
  });

  doc.querySelectorAll('.mk-table-wrap').forEach((wrapper) => {
    const existing = wrapper.getAttribute('style') || '';
    wrapper.setAttribute(
      'style',
      `${existing}; display:block;width:100%;max-width:100%;overflow-x:auto;overflow-y:hidden;margin:20px 0;padding-bottom:8px;-webkit-overflow-scrolling:touch`
    );
  });

  doc.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((heading) => {
    heading.querySelectorAll('strong,em,a,code,span,b,i').forEach((node) => {
      const existing = node.getAttribute('style') || '';
      node.setAttribute(
        'style',
        `${existing}; color:inherit !important;background:transparent !important;border-color:currentColor !important`
      );
    });
  });

  const container = doc.createElement('div');
  container.className = 'mk-rendered-article';
  container.setAttribute('style', theme.styles.container);
  container.innerHTML = doc.body.innerHTML;
  return container.outerHTML;
}

export async function renderMarkdown(markdown: string, themeId: string, imageStore?: ImageStore) {
  if (!markdown.trim()) return '';
  const raw = parser.render(preprocessMarkdown(markdown));
  const withImages = await resolveLocalImages(raw, imageStore);
  return applyThemeStyles(sanitize(withImages), themeId);
}

function convertImageGridsToTables(doc: Document) {
  doc.querySelectorAll('.image-grid').forEach((grid) => {
    const columns = Number(grid.getAttribute('data-columns') || 2);
    const cells = Array.from(grid.querySelectorAll('img'));
    const table = doc.createElement('table');
    table.setAttribute('style', 'width:100%;border-collapse:collapse;margin:20px auto;table-layout:fixed;border:none;background:transparent');

    for (let index = 0; index < cells.length; index += columns) {
      const row = doc.createElement('tr');
      cells.slice(index, index + columns).forEach((image) => {
        const cell = doc.createElement('td');
        cell.setAttribute('style', `width:${100 / columns}%;padding:4px;border:none;background:transparent;text-align:center;vertical-align:top`);
        const cloned = image.cloneNode(true) as HTMLImageElement;
        cloned.setAttribute('style', 'max-width:100%;height:auto;display:inline-block;border-radius:4px');
        cell.appendChild(cloned);
        row.appendChild(cell);
      });
      table.appendChild(row);
    }

    grid.replaceWith(table);
  });
}

export async function prepareClipboardHtml(html: string, imageStore?: ImageStore) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  convertImageGridsToTables(doc);

  if (imageStore) {
    for (const image of Array.from(doc.querySelectorAll('img[data-image-id]'))) {
      const id = image.getAttribute('data-image-id');
      if (!id) continue;
      const blob = await imageStore.getBlob(id);
      if (blob) image.setAttribute('src', await blobToDataUrl(blob));
    }
  }

  doc.querySelectorAll('li').forEach((item) => {
    item.textContent = item.textContent?.replace(/\s+/g, ' ').trim() || '';
  });

  return {
    html: doc.body.innerHTML,
    text: doc.body.textContent || ''
  };
}

export function getTheme(themeId: string): Theme {
  return themeMap[themeId] || themeMap[defaultThemeId];
}
