import { Download, FileDown, FileUp, ImageOff, Trash2, X } from 'lucide-react';
import { formatDate } from '../lib/date';
import { formatSize } from '../lib/imageStore';
import { getTheme } from '../lib/render';
import type { HistoryArticle } from '../types';

export type ImageAssetSummary = {
  count: number;
  bytes: number;
  orphanCount: number;
  orphanBytes: number;
};

type HistoryPanelProps = {
  history: HistoryArticle[];
  imageSummary: ImageAssetSummary | null;
  onClose: () => void;
  onCleanImages: () => void;
  onClear: () => void;
  onDownload: (article: HistoryArticle) => void;
  onExport: () => void;
  onImport: (file?: File) => void;
  onLoad: (article: HistoryArticle) => void;
  onDelete: (id: string) => void;
};

export function HistoryPanel({
  history,
  imageSummary,
  onClose,
  onCleanImages,
  onClear,
  onDownload,
  onExport,
  onImport,
  onLoad,
  onDelete
}: HistoryPanelProps) {
  return (
    <>
      <button className="overlay" aria-label="关闭历史记录" onClick={onClose} />
      <aside className="side-panel">
        <div className="panel-header">
          <div>
            <h2>历史记录</h2>
            <p>{history.length}/20</p>
          </div>
          <button className="icon-button" aria-label="关闭历史记录" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="history-tools">
          <button className="tool-button" onClick={onExport}>
            <FileDown size={16} />
            导出
          </button>
          <label className="tool-button">
            <FileUp size={16} />
            导入
            <input
              className="hidden-input"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                onImport(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </label>
          <button className="tool-button" onClick={onCleanImages}>
            <ImageOff size={16} />
            清理图片
          </button>
          <button className="tool-button danger-inline" onClick={onClear}>
            <Trash2 size={16} />
            清空
          </button>
          <span className="asset-summary">
            本地图片 {imageSummary ? `${imageSummary.count} 张 / ${formatSize(imageSummary.bytes)}，可清理 ${imageSummary.orphanCount} 张 / ${formatSize(imageSummary.orphanBytes)}` : '统计中'}
          </span>
        </div>
        <div className="history-list">
          {history.length === 0 && <p className="muted">复制或保存文章后会出现在这里。</p>}
          {history.map((article) => (
            <article className="history-item" key={article.id}>
              <button className="history-main" onClick={() => onLoad(article)}>
                <strong>{article.title}</strong>
                <span>
                  {formatDate(article.updatedAt)} · {getTheme(article.style).name}
                </span>
              </button>
              <button className="icon-button" onClick={() => onDownload(article)} title="下载 Markdown" aria-label={`下载 ${article.title}`}>
                <Download size={16} />
              </button>
              <button className="icon-button danger" onClick={() => onDelete(article.id)} title="删除" aria-label={`删除 ${article.title}`}>
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      </aside>
    </>
  );
}
