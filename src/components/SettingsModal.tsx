import { Download, Eye, EyeOff, Star, Upload, X } from 'lucide-react';
import { getTheme } from '../lib/render';
import { themes } from '../styles/themes';

type SettingsModalProps = {
  themeId: string;
  hidden: string[];
  starred: string[];
  order: string[];
  onClose: () => void;
  onToggleHidden: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onReset: () => void;
};

export function SettingsModal({
  themeId,
  hidden,
  starred,
  order,
  onClose,
  onToggleHidden,
  onMove,
  onReset
}: SettingsModalProps) {
  const ordered = order.filter((id) => themes.some((theme) => theme.id === id));
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="settings-modal">
        <div className="panel-header">
          <div>
            <h2>主题管理</h2>
            <p>调整显示状态和顺序</p>
          </div>
          <button className="icon-button" aria-label="关闭主题管理" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="settings-grid">
          {ordered.map((id) => {
            const theme = getTheme(id);
            const isHidden = hidden.includes(id);
            return (
              <div className={`settings-row ${isHidden ? 'is-hidden' : ''}`} key={id}>
                <span className="swatch" style={{ background: theme.accent }} />
                <span>{theme.name}</span>
                {id === themeId && <span className="badge">当前</span>}
                {starred.includes(id) && <Star className="star-marker" size={14} fill="currentColor" />}
                <button className="icon-button" onClick={() => onMove(id, -1)} title="上移" aria-label={`${theme.name} 上移`}>
                  <Upload size={15} />
                </button>
                <button className="icon-button" onClick={() => onMove(id, 1)} title="下移" aria-label={`${theme.name} 下移`}>
                  <Download size={15} />
                </button>
                <button className="icon-button" onClick={() => onToggleHidden(id)} title={isHidden ? '显示' : '隐藏'} aria-label={`${theme.name} ${isHidden ? '显示' : '隐藏'}`}>
                  {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="modal-actions">
          <button className="tool-button" onClick={onReset}>
            恢复默认
          </button>
          <button className="copy-button" onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
