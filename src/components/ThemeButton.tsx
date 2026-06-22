import { Star } from 'lucide-react';
import { getTheme } from '../lib/render';

type ThemeButtonProps = {
  id: string;
  themeId: string;
  onSelect: (id: string) => void;
  starred?: boolean;
  onStar?: () => void;
};

export function ThemeButton({ id, themeId, onSelect, starred, onStar }: ThemeButtonProps) {
  const theme = getTheme(id);
  return (
    <button
      className={`theme-chip ${themeId === id ? 'active' : ''} ${theme.recommended ? 'recommended' : ''}`}
      style={{ borderColor: themeId === id ? theme.accent : undefined }}
      onClick={() => onSelect(id)}
      aria-pressed={themeId === id}
      onContextMenu={(event) => {
        event.preventDefault();
        onStar?.();
      }}
      title={onStar ? '右键收藏或取消收藏' : undefined}
    >
      <span className="theme-mini-preview" style={{ background: theme.paper, borderColor: theme.accent }} aria-hidden="true">
        <span style={{ background: theme.accent }} />
        <span style={{ background: theme.ink }} />
        <span style={{ background: theme.accent }} />
      </span>
      {theme.name}
      {starred && <Star size={12} fill="currentColor" />}
    </button>
  );
}
