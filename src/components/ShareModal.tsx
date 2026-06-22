import { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

type ShareModalProps = {
  url: string;
  onClose: () => void;
};

export function ShareModal({ url, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="share-card">
        <div className="panel-header">
          <h2>分享链接</h2>
          <button className="icon-button" aria-label="关闭分享链接" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <input className="share-input" data-testid="share-url-input" value={url} readOnly />
        <div className="modal-actions">
          <button
            className="tool-button"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已复制' : '复制链接'}
          </button>
          <a className="copy-button" href={url} target="_blank" rel="noreferrer">
            打开
          </a>
        </div>
      </div>
    </div>
  );
}
