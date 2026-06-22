import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';
import { renderMermaidBlocks } from '../lib/mermaidBlocks';
import { getTheme, renderMarkdown } from '../lib/render';
import type { ShareRecord } from '../types';

type SharePageProps = {
  id: string;
};

export function SharePage({ id }: SharePageProps) {
  const { toast, showToast } = useToast();
  const [share, setShare] = useState<ShareRecord | null>(null);
  const [rendered, setRendered] = useState('');

  useEffect(() => {
    fetch(`/api/share/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '分享不存在');
        setShare(data as ShareRecord);
      })
      .catch((error) => showToast(error.message, 'error'));
  }, [id]);

  useEffect(() => {
    if (!share) return;
    renderMarkdown(share.content, share.style).then(setRendered).catch(() => showToast('渲染失败', 'error'));
  }, [share]);

  useEffect(() => {
    if (!rendered) return;
    let canceled = false;
    renderMermaidBlocks('.shared-article .mermaid', () => canceled).catch(() => undefined);
    return () => {
      canceled = true;
    };
  }, [rendered]);

  return (
    <div className="share-page">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">M</span>
          <span>Markdown Kits</span>
        </a>
        <span className="badge">{share ? getTheme(share.style).name : '分享'}</span>
      </header>
      <main className="shared-article">
        {rendered ? <div dangerouslySetInnerHTML={{ __html: rendered }} /> : <div className="empty-state">正在加载内容...</div>}
      </main>
      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}
    </div>
  );
}
