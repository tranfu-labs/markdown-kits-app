import { type ClipboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, Edit3, Eye, FileUp, History, Image as ImageIcon, List, Printer, Save, Settings, Share2, Sparkles, Star } from 'lucide-react';
import { HistoryPanel } from '../components/HistoryPanel';
import { SettingsModal } from '../components/SettingsModal';
import { ShareModal } from '../components/ShareModal';
import { ThemeButton } from '../components/ThemeButton';
import { useThemePrefs } from '../hooks/useThemePrefs';
import { useToast } from '../hooks/useToast';
import { fixCjkSpacing } from '../lib/autocorrect';
import { defaultMarkdown, isMarkdown, maxMarkdownFileBytes } from '../lib/editorHelpers';
import { extractTitle, loadDraft, loadHistory, saveDraft, saveHistory, upsertHistory } from '../lib/history';
import { blobToDataUrl, compressImage, formatSize, ImageStore } from '../lib/imageStore';
import {
  collectReferencedLocalImageIds,
  createHistoryExport,
  findOrphanImages,
  markdownFileName,
  parseHistoryImport,
  summarizeImages
} from '../lib/localAssets';
import { renderMermaidBlocks } from '../lib/mermaidBlocks';
import { getTheme, prepareClipboardHtml, renderMarkdown } from '../lib/render';
import { defaultThemeId, themeCategories } from '../styles/themes';
import type { HistoryArticle, ShareRecord } from '../types';
import type { ImageAssetSummary } from '../components/HistoryPanel';

export function EditorPage() {
  const draft = useMemo(() => loadDraft(defaultMarkdown, defaultThemeId), []);
  const imageStore = useMemo(() => new ImageStore(), []);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const renderTick = useRef(0);
  const draftStorageFailed = useRef(false);
  const { toast, showToast } = useToast();

  const [markdown, setMarkdown] = useState(draft.content);
  const [themeId, setThemeId] = useState(getTheme(draft.style).id);
  const [rendered, setRendered] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState<HistoryArticle[]>(() => loadHistory());
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [imageSummary, setImageSummary] = useState<ImageAssetSummary | null>(null);
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit');
  const [themeSearch, setThemeSearch] = useState('');
  const [themeCategory, setThemeCategory] = useState('全部');
  const {
    hidden,
    moveStyle,
    resetThemePrefs,
    setStarred,
    starred,
    styleOrder,
    toggleHidden,
    visibleThemeIds
  } = useThemePrefs(themeId, setThemeId);

  const filteredThemeIds = useMemo(() => {
    const keyword = themeSearch.trim().toLowerCase();
    return visibleThemeIds.filter((id) => {
      const theme = getTheme(id);
      const matchesCategory = themeCategory === '全部' || theme.category === themeCategory;
      const matchesKeyword = !keyword || [theme.name, theme.id, theme.category].some((value) => value.toLowerCase().includes(keyword));
      return matchesCategory && matchesKeyword;
    });
  }, [themeCategory, themeSearch, visibleThemeIds]);

  const filteredStarredIds = useMemo(() => starred.filter((id) => filteredThemeIds.includes(id)), [filteredThemeIds, starred]);

  useEffect(() => {
    imageStore.init().catch(() => showToast('图片存储初始化失败', 'error'));
    return () => imageStore.dispose();
  }, [imageStore]);

  useEffect(() => {
    const saved = saveDraft(markdown, themeId);
    if (!saved && !draftStorageFailed.current) {
      draftStorageFailed.current = true;
      showToast('草稿保存失败，浏览器存储空间不足', 'error');
    }
    if (saved) draftStorageFailed.current = false;
    const tick = (renderTick.current += 1);
    renderMarkdown(markdown, themeId, imageStore)
      .then((html) => {
        if (tick === renderTick.current) setRendered(html);
      })
      .catch((error) => {
        console.error(error);
        showToast('预览渲染失败', 'error');
      });
  }, [markdown, themeId, imageStore]);

  useEffect(() => {
    if (!rendered) return;
    let canceled = false;
    renderMermaidBlocks('.preview-container .mermaid', () => canceled).catch(() => undefined);
    return () => {
      canceled = true;
    };
  }, [rendered]);

  useEffect(() => {
    if (!showHistory) return;
    refreshImageSummary().catch(() => showToast('图片统计失败', 'error'));
  }, [showHistory, markdown, history, imageStore]);

  function downloadText(filename: string, content: string, type = 'text/plain;charset=utf-8') {
    downloadBlob(filename, new Blob([content], { type }));
  }

  function downloadBlob(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function clipboardFailureMessage(error: unknown) {
    if (!window.isSecureContext) return '当前页面不是安全上下文，浏览器可能限制剪贴板。';
    if (error instanceof DOMException && error.name === 'NotAllowedError') return '浏览器拒绝剪贴板权限。';
    if (error instanceof DOMException && error.name === 'NotFoundError') return '浏览器未提供可写剪贴板。';
    return 'HTML 复制失败。';
  }

  async function refreshImageSummary() {
    const images = await imageStore.listMetadata();
    const referenced = collectReferencedLocalImageIds(markdown, history);
    const total = summarizeImages(images);
    const orphan = summarizeImages(findOrphanImages(images, referenced));
    setImageSummary({
      count: total.count,
      bytes: total.bytes,
      orphanCount: orphan.count,
      orphanBytes: orphan.bytes
    });
  }

  function insertText(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMarkdown((current) => `${current}\n${text}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setMarkdown((current) => `${current.slice(0, start)}${text}${current.slice(end)}`);
    window.requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    });
  }

  async function handleImage(file: File) {
    if (!file.type.startsWith('image/')) {
      showToast('只支持图片文件', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('图片不能超过 10MB', 'error');
      return;
    }

    const compressed = await compressImage(file);
    const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const name = file.name.replace(/\.[^/.]+$/, '') || '图片';
    await imageStore.save(compressed, {
      id,
      name,
      originalSize: file.size,
      mimeType: compressed.type || file.type
    });
    insertText(`![${name}](local-img://${id})`);
    showToast(`图片已保存 ${formatSize(file.size)} → ${formatSize(compressed.size)}`);
  }

  async function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith('image/'));
    if (file) {
      event.preventDefault();
      await handleImage(file);
      return;
    }

    const html = event.clipboardData.getData('text/html');
    const text = event.clipboardData.getData('text/plain');
    if (html && text && !isMarkdown(text)) {
      event.preventDefault();
      const { default: TurndownService } = await import('turndown');
      const turndown = new TurndownService({
        headingStyle: 'atx',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced'
      });
      turndown.keep(['table', 'thead', 'tbody', 'tr', 'th', 'td']);
      const converted = turndown.turndown(html).replace(/\n{3,}/g, '\n\n');
      insertText(converted);
      showToast('已转换为 Markdown');
    }
  }

  async function handleFileUpload(file?: File) {
    if (!file) return;
    if (file.size > maxMarkdownFileBytes) {
      showToast('Markdown 文件不能超过 2MB', 'error');
      return;
    }
    setMarkdown(await file.text());
    setCurrentArticleId(null);
    showToast('Markdown 文件已加载');
  }

  function saveCurrentArticle(options: { silentSuccess?: boolean } = {}) {
    if (!markdown.trim()) {
      showToast('内容为空，无法保存', 'error');
      return false;
    }
    const result = upsertHistory(history, markdown, themeId, currentArticleId);
    if (!result.saved) {
      showToast('历史保存失败，浏览器存储空间不足', 'error');
      return false;
    }
    setHistory(result.history);
    setCurrentArticleId(result.id);
    if (!options.silentSuccess) {
      showToast(currentArticleId ? '已更新历史记录' : '已保存到历史记录');
    }
    return true;
  }

  async function copyToWechat() {
    if (!rendered) {
      showToast('没有可复制内容', 'error');
      return;
    }

    try {
      await renderMermaidBlocks('.preview-container .mermaid').catch(() => undefined);
      const prepared = await prepareClipboardHtml(previewRef.current?.innerHTML || rendered, imageStore);
      const item = new ClipboardItem({
        'text/html': new Blob([prepared.html], { type: 'text/html' }),
        'text/plain': new Blob([prepared.text], { type: 'text/plain' })
      });
      await navigator.clipboard.write([item]);
      setCopySuccess(true);
      const savedHistory = saveCurrentArticle({ silentSuccess: true });
      showToast(savedHistory ? '已复制到剪贴板' : '已复制到剪贴板，历史保存失败');
      window.setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error(error);
      const message = clipboardFailureMessage(error);
      try {
        await navigator.clipboard.writeText(markdown);
        showToast(`${message}已复制 Markdown 文本`, 'error');
      } catch {
        showToast(`${message}请检查浏览器权限或 HTTPS 环境`, 'error');
      }
    }
  }

  async function downloadHtml() {
    if (!rendered) {
      showToast('没有可下载内容', 'error');
      return;
    }
    try {
      await renderMermaidBlocks('.preview-container .mermaid').catch(() => undefined);
      const prepared = await prepareClipboardHtml(previewRef.current?.innerHTML || rendered, imageStore);
      downloadText(`markdown-kits-${new Date().toISOString().slice(0, 10)}.html`, prepared.html, 'text/html;charset=utf-8');
      showToast('HTML 已下载');
    } catch {
      showToast('HTML 下载失败', 'error');
    }
  }

  async function printPdf() {
    if (!rendered) {
      showToast('没有可打印内容', 'error');
      return;
    }
    try {
      await renderMermaidBlocks('.preview-container .mermaid').catch(() => undefined);
      const prepared = await prepareClipboardHtml(previewRef.current?.innerHTML || rendered, imageStore);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('浏览器阻止了 PDF 打印窗口', 'error');
        return;
      }
      printWindow.document.write([
        '<!doctype html><html><head><meta charset="utf-8">',
        '<title>Markdown Kits PDF</title>',
        '<style>body{margin:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.mk-print-page{max-width:820px;margin:0 auto;padding:32px 18px;background:#fff}@media print{body{background:#fff}.mk-print-page{padding:0;max-width:none}}</style>',
        '</head><body><main class="mk-print-page">',
        prepared.html,
        '</main><script>window.onload=function(){window.focus();setTimeout(function(){window.print();},150);};</script></body></html>'
      ].join(''));
      printWindow.document.close();
      showToast('已打开 PDF 打印视图');
    } catch {
      showToast('PDF 打印视图打开失败', 'error');
    }
  }

  function plainExcerpt(content: string) {
    return content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/!\[[^\]]*]\([^)]+\)/g, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[#>*_`|[\]()~-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);
  }

  function drawWrappedText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number
  ) {
    let line = '';
    let lines = 0;
    for (const char of text) {
      const next = line + char;
      if (context.measureText(next).width > maxWidth && line) {
        context.fillText(line, x, y);
        y += lineHeight;
        lines += 1;
        line = char;
        if (lines >= maxLines - 1) break;
      } else {
        line = next;
      }
    }
    if (line && lines < maxLines) {
      context.fillText(lines === maxLines - 1 && line.length < text.length ? `${line}...` : line, x, y);
    }
  }

  async function downloadXhsCard() {
    if (!markdown.trim()) {
      showToast('内容为空，无法生成卡片', 'error');
      return;
    }
    const theme = getTheme(themeId);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const context = canvas.getContext('2d');
    if (!context) {
      showToast('卡片生成失败', 'error');
      return;
    }
    const title = extractTitle(markdown);
    const excerpt = plainExcerpt(markdown) || 'Markdown Kits';

    context.fillStyle = theme.paper;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = theme.accent;
    context.fillRect(0, 0, canvas.width, 18);
    context.fillRect(80, 180, 120, 12);
    context.fillRect(80, 1260, 240, 8);
    context.fillStyle = theme.ink;
    context.font = '700 78px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    drawWrappedText(context, title, 80, 340, 920, 96, 4);
    context.font = '400 34px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    context.fillStyle = theme.ink;
    context.globalAlpha = 0.78;
    drawWrappedText(context, excerpt, 82, 780, 880, 54, 5);
    context.globalAlpha = 1;
    context.fillStyle = theme.accent;
    context.font = '700 28px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    context.fillText(getTheme(themeId).name, 80, 1328);
    context.fillStyle = theme.ink;
    context.globalAlpha = 0.62;
    context.font = '600 26px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    context.fillText('Markdown Kits', 80, 1372);
    context.globalAlpha = 1;

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
      showToast('卡片生成失败', 'error');
      return;
    }
    downloadBlob(`markdown-kits-card-${new Date().toISOString().slice(0, 10)}.png`, blob);
    showToast('小红书卡片已下载');
  }

  async function contentForShare() {
    const matches = Array.from(markdown.matchAll(/!\[([^\]]*)]\(local-img:\/\/([^)]+)\)/g));
    let content = markdown;
    for (const [full, alt, id] of matches) {
      const blob = await imageStore.getBlob(id);
      if (!blob) continue;
      content = content.split(full).join(`![${alt}](${await blobToDataUrl(blob)})`);
    }
    return content;
  }

  async function shareContent() {
    if (!markdown.trim()) {
      showToast('内容为空，无法分享', 'error');
      return;
    }
    setSharing(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: await contentForShare(), style: themeId })
      });
      const data = (await response.json()) as ShareRecord | { error: string };
      if (!response.ok) throw new Error('error' in data ? data.error : '分享失败');
      if (!('id' in data)) throw new Error('分享响应格式错误');
      const url = `${window.location.origin}/s/${data.id}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url).catch(() => undefined);
      showToast('分享链接已生成');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '分享失败', 'error');
    } finally {
      setSharing(false);
    }
  }

  function exportHistory() {
    downloadText(`markdown-kits-history-${new Date().toISOString().slice(0, 10)}.json`, createHistoryExport(history), 'application/json;charset=utf-8');
    showToast('历史记录已导出');
  }

  async function importHistory(file?: File) {
    if (!file) return;
    try {
      const imported = parseHistoryImport(await file.text());
      if (!saveHistory(imported)) {
        showToast('历史导入失败，浏览器存储空间不足', 'error');
        return;
      }
      setHistory(imported);
      setCurrentArticleId(null);
      showToast(`已导入 ${imported.length} 篇历史记录`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '历史导入失败', 'error');
    }
  }

  function clearHistory() {
    if (history.length === 0) {
      showToast('历史记录已为空');
      return;
    }
    if (!window.confirm('确认清空所有历史记录？')) return;
    if (!saveHistory([])) {
      showToast('历史清空失败，浏览器存储空间不足', 'error');
      return;
    }
    setHistory([]);
    setCurrentArticleId(null);
    showToast('历史记录已清空');
  }

  function downloadArticle(article: HistoryArticle) {
    downloadText(markdownFileName(article.title), article.content, 'text/markdown;charset=utf-8');
  }

  async function cleanOrphanImages() {
    try {
      const images = await imageStore.listMetadata();
      const referenced = collectReferencedLocalImageIds(markdown, history);
      const orphans = findOrphanImages(images, referenced);
      const summary = summarizeImages(orphans);
      if (summary.count === 0) {
        setImageSummary({
          ...summarizeImages(images),
          orphanCount: 0,
          orphanBytes: 0
        });
        showToast('没有可清理的本地图片');
        return;
      }
      if (!window.confirm(`将删除 ${summary.count} 张未被草稿或历史引用的本地图片，共 ${formatSize(summary.bytes)}。确认继续？`)) return;
      for (const image of orphans) {
        await imageStore.delete(image.id);
      }
      await refreshImageSummary();
      showToast(`已清理 ${summary.count} 张本地图片`);
    } catch {
      showToast('本地图片清理失败', 'error');
    }
  }

  const currentTheme = getTheme(themeId);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Markdown Kits 首页">
          <span className="brand-mark">M</span>
          <span>Markdown Kits</span>
        </a>
        <div className="topbar-actions">
          <button className="icon-button" title="主题管理" aria-label="主题管理" onClick={() => setShowSettings(true)}>
            <Settings size={18} />
          </button>
          <a className="text-link" href="/list">
            管理
          </a>
        </div>
      </header>

      <section className="theme-strip" aria-label="选择主题">
        <span className="theme-label">选择样式</span>
        <div className="theme-filter">
          <input value={themeSearch} onChange={(event) => setThemeSearch(event.target.value)} type="search" placeholder="搜索主题" aria-label="搜索主题" />
          <select value={themeCategory} onChange={(event) => setThemeCategory(event.target.value)} aria-label="主题分类">
            {themeCategories.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="theme-list">
          {filteredStarredIds.map((id) => (
            <ThemeButton key={`star-${id}`} id={id} themeId={themeId} onSelect={setThemeId} starred />
          ))}
          {filteredThemeIds.map((id) => (
            <ThemeButton
              key={id}
              id={id}
              themeId={themeId}
              onSelect={setThemeId}
              starred={starred.includes(id)}
              onStar={() =>
                setStarred((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
              }
            />
          ))}
        </div>
        <div className="mobile-pane-toggle" role="tablist" aria-label="移动端视图">
          <button className={mobilePane === 'edit' ? 'active' : ''} onClick={() => setMobilePane('edit')} aria-pressed={mobilePane === 'edit'}>
            <Edit3 size={15} />
            编辑
          </button>
          <button className={mobilePane === 'preview' ? 'active' : ''} onClick={() => setMobilePane('preview')} aria-pressed={mobilePane === 'preview'}>
            <Eye size={15} />
            预览
          </button>
        </div>
      </section>

      <main className={`workspace mobile-${mobilePane}`}>
        <section className="editor-pane" aria-label="Markdown 编辑区">
          <div className="pane-toolbar">
            <label className="tool-button">
              <FileUp size={16} />
              上传 MD
              <input
                className="hidden-input"
                type="file"
                accept=".md,.markdown,text/markdown,text/plain"
                onChange={(event) => handleFileUpload(event.target.files?.[0])}
              />
            </label>
            <button className="tool-button" onClick={() => setMarkdown(fixCjkSpacing(markdown))} disabled={!markdown}>
              <Sparkles size={16} />
              修复空格
            </button>
            <span className="char-count">{markdown.length} 字符</span>
          </div>
          <textarea
            ref={textareaRef}
            data-testid="markdown-input"
            className={`markdown-input ${dragOver ? 'drag-over' : ''}`}
            value={markdown}
            onChange={(event) => {
              setMarkdown(event.target.value);
              if (!event.target.value.trim()) setCurrentArticleId(null);
            }}
            onPaste={handlePaste}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={async (event) => {
              event.preventDefault();
              setDragOver(false);
              const image = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith('image/'));
              if (image) await handleImage(image);
            }}
            spellCheck={false}
          />
        </section>

        <section className="preview-pane" aria-label="公众号预览">
          <div className="pane-toolbar preview-toolbar">
            <div className="preview-title">
              <span>预览</span>
              <span className="theme-name" style={{ color: currentTheme.accent }}>{currentTheme.name}</span>
            </div>
            <div className="preview-actions">
              <button
                className="icon-button"
                title="收藏主题"
                aria-label="收藏主题"
                onClick={() => setStarred((current) => (current.includes(themeId) ? current.filter((id) => id !== themeId) : [...current, themeId]))}
              >
                <Star size={18} fill={starred.includes(themeId) ? 'currentColor' : 'none'} />
              </button>
              <button className="tool-button" onClick={shareContent} disabled={sharing || !markdown}>
                <Share2 size={16} />
                {sharing ? '分享中' : '分享'}
              </button>
              <button className="tool-button" onClick={() => setShowHistory(true)}>
                <History size={16} />
                历史
              </button>
              <button className="tool-button" onClick={() => saveCurrentArticle()}>
                <Save size={16} />
                保存
              </button>
              <button className="tool-button" onClick={downloadHtml} disabled={!rendered}>
                <Download size={16} />
                HTML
              </button>
              <button className="tool-button" onClick={printPdf} disabled={!rendered}>
                <Printer size={16} />
                PDF
              </button>
              <button className="tool-button" onClick={downloadXhsCard} disabled={!markdown}>
                <ImageIcon size={16} />
                卡片
              </button>
              <button className={`copy-button ${copySuccess ? 'success' : ''}`} onClick={copyToWechat} disabled={!rendered}>
                {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                {copySuccess ? '已复制' : '复制到公众号'}
              </button>
            </div>
          </div>
          <div className="preview-content">
            {rendered ? (
              <div ref={previewRef} data-testid="preview" className="preview-container" dangerouslySetInnerHTML={{ __html: rendered }} />
            ) : (
              <div className="empty-state">
                <List size={42} />
                <h2>开始编辑</h2>
                <p>左侧输入 Markdown，右侧实时预览。</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {showHistory && (
        <HistoryPanel
          history={history}
          imageSummary={imageSummary}
          onClose={() => setShowHistory(false)}
          onCleanImages={cleanOrphanImages}
          onClear={clearHistory}
          onDownload={downloadArticle}
          onExport={exportHistory}
          onImport={importHistory}
          onLoad={(article) => {
            setMarkdown(article.content);
            setThemeId(getTheme(article.style).id);
            setCurrentArticleId(article.id);
            setShowHistory(false);
          }}
          onDelete={(id) => {
            const next = history.filter((article) => article.id !== id);
            if (saveHistory(next)) {
              setHistory(next);
            } else {
              showToast('历史删除失败，浏览器存储空间不足', 'error');
            }
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          themeId={themeId}
          hidden={hidden}
          starred={starred}
          order={styleOrder}
          onClose={() => setShowSettings(false)}
          onToggleHidden={toggleHidden}
          onMove={moveStyle}
          onReset={resetThemePrefs}
        />
      )}

      {shareUrl && <ShareModal url={shareUrl} onClose={() => setShareUrl('')} />}
      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}
    </div>
  );
}
