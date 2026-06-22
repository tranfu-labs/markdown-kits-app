import type { Theme, ThemeStyles } from '../types';

type Palette = {
  id: string;
  name: string;
  category: string;
  accent: string;
  paper: string;
  ink: string;
  muted: string;
  font: string;
  heading: string;
  recommended?: boolean;
  serif?: boolean;
};

function createTheme(palette: Palette): Theme {
  const mono = '"SF Mono", "Cascadia Code", Consolas, monospace';
  const styles: ThemeStyles = {
    container: [
      'max-width: 720px',
      'margin: 0 auto',
      'padding: 18px 18px 38px',
      `font-family: ${palette.font}`,
      'font-size: 16px',
      'line-height: 1.78',
      `color: ${palette.ink} !important`,
      `background-color: ${palette.paper} !important`,
      'word-wrap: break-word'
    ].join('; '),
    h1: [
      `font-family: ${palette.heading}`,
      'font-size: 30px',
      'line-height: 1.22 !important',
      'font-weight: 700',
      `color: ${palette.ink} !important`,
      `border-bottom: 3px solid ${palette.accent}`,
      'padding-bottom: 12px',
      'margin: 34px 0 18px'
    ].join('; '),
    h2: [
      `font-family: ${palette.heading}`,
      'font-size: 23px',
      'line-height: 1.32 !important',
      'font-weight: 700',
      `color: ${palette.ink} !important`,
      `border-left: 5px solid ${palette.accent}`,
      'padding: 4px 0 4px 14px',
      'margin: 30px 0 16px'
    ].join('; '),
    h3: [
      `font-family: ${palette.heading}`,
      'font-size: 20px',
      'line-height: 1.38 !important',
      'font-weight: 650',
      `color: ${palette.accent} !important`,
      'margin: 26px 0 12px'
    ].join('; '),
    h4: `font-size: 18px; line-height: 1.42 !important; font-weight: 650; color: ${palette.ink} !important; margin: 22px 0 10px`,
    h5: `font-size: 16px; line-height: 1.45 !important; font-weight: 650; color: ${palette.ink} !important; margin: 18px 0 8px`,
    h6: `font-size: 15px; line-height: 1.45 !important; font-weight: 600; color: ${palette.muted} !important; margin: 16px 0 8px`,
    p: `margin: 16px 0 !important; line-height: 1.78 !important; color: ${palette.ink} !important`,
    strong: `font-weight: 700; color: ${palette.accent} !important`,
    em: `font-style: italic; color: ${palette.muted} !important`,
    a: `color: ${palette.accent} !important; text-decoration: none; border-bottom: 1px solid ${palette.accent}`,
    blockquote: [
      'margin: 20px 0',
      'padding: 12px 16px',
      `border-left: 4px solid ${palette.accent}`,
      `background: color-mix(in srgb, ${palette.accent} 8%, transparent)`,
      `color: ${palette.ink} !important`,
      'line-height: 1.65 !important'
    ].join('; '),
    code: [
      `font-family: ${mono}`,
      'font-size: 14px',
      'padding: 2px 6px',
      `background-color: color-mix(in srgb, ${palette.accent} 10%, white) !important`,
      `color: ${palette.accent} !important`,
      'border-radius: 4px'
    ].join('; '),
    pre: [
      'margin: 22px 0',
      'padding: 0',
      'background: #24272f !important',
      'border-radius: 8px',
      'overflow-x: auto',
      'line-height: 1.6 !important'
    ].join('; '),
    ul: 'margin: 16px 0; padding-left: 24px',
    ol: 'margin: 16px 0; padding-left: 24px',
    li: `margin: 8px 0; line-height: 1.72 !important; color: ${palette.ink} !important`,
    img: 'max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 6px',
    table: 'width: 720px; min-width: 100%; max-width: none; table-layout: auto; border-collapse: collapse; margin: 0',
    th: `padding: 10px 12px; text-align: left; background-color: ${palette.accent} !important; color: #fff !important; border: 1px solid color-mix(in srgb, ${palette.accent} 72%, black); white-space: nowrap`,
    td: `padding: 10px 12px; border: 1px solid color-mix(in srgb, ${palette.muted} 28%, white); color: ${palette.ink} !important; background: ${palette.paper} !important; white-space: nowrap`,
    hr: `margin: 34px auto; border: none; height: 2px; max-width: 180px; background: ${palette.accent} !important`
  };

  if (palette.serif) {
    styles.p += '; text-align: justify';
    styles.h1 += '; letter-spacing: 0.01em';
    styles.blockquote += '; font-style: italic';
  }

  return {
    id: palette.id,
    name: palette.name,
    category: palette.category,
    accent: palette.accent,
    paper: palette.paper,
    ink: palette.ink,
    recommended: palette.recommended,
    styles
  };
}

const sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
const serif = '"Songti SC", "Noto Serif SC", Georgia, "Times New Roman", serif';

const palettes: Palette[] = [
  { id: 'classic-ink', name: '经典墨线', category: '通用', accent: '#1769aa', paper: '#ffffff', ink: '#23313d', muted: '#667085', font: sans, heading: sans },
  { id: 'redline-report', name: '红线简报', category: '商务', accent: '#c52233', paper: '#ffffff', ink: '#201a1a', muted: '#6b5555', font: sans, heading: sans },
  { id: 'ledger-serif', name: '财经纸页', category: '商务', accent: '#8f1235', paper: '#fff3e7', ink: '#2b2723', muted: '#6e6258', font: serif, heading: serif, serif: true, recommended: true },
  { id: 'clay-notes', name: '陶土笔记', category: '长文', accent: '#b75b3d', paper: '#faf7f2', ink: '#302b27', muted: '#77685d', font: sans, heading: sans, recommended: true },
  { id: 'tech-console', name: '技术蓝图', category: '技术', accent: '#006d77', paper: '#fbfdff', ink: '#1d2b32', muted: '#5c6b73', font: sans, heading: sans },
  { id: 'quiet-editorial', name: '安静长文', category: '长文', accent: '#455a64', paper: '#ffffff', ink: '#202124', muted: '#74777c', font: serif, heading: serif, serif: true },
  { id: 'deep-read', name: '深度阅读', category: '长文', accent: '#244c7c', paper: '#f7f8f4', ink: '#18212b', muted: '#607083', font: serif, heading: serif, serif: true },
  { id: 'newsroom', name: '新闻编辑部', category: '商务', accent: '#111827', paper: '#ffffff', ink: '#111827', muted: '#5f6673', font: sans, heading: serif, serif: true },
  { id: 'minimal-device', name: '设备极简', category: '技术', accent: '#0f766e', paper: '#fbfbfb', ink: '#171717', muted: '#737373', font: sans, heading: sans },
  { id: 'field-guide', name: '田野指南', category: '自然', accent: '#597d35', paper: '#fbfaf4', ink: '#243018', muted: '#68745e', font: serif, heading: serif, serif: true, recommended: true },
  { id: 'wire-mag', name: '线框杂志', category: '杂志', accent: '#e2552d', paper: '#ffffff', ink: '#151515', muted: '#5f5f5f', font: sans, heading: sans, recommended: true },
  { id: 'silver-lab', name: '银色实验室', category: '技术', accent: '#3d5a80', paper: '#f7f9fb', ink: '#1f2933', muted: '#697586', font: sans, heading: sans, recommended: true },
  { id: 'plain-song', name: '宋体白纸', category: '长文', accent: '#1f4e5f', paper: '#fffefa', ink: '#171412', muted: '#625c56', font: serif, heading: serif, serif: true },
  { id: 'research-card', name: '研究札记', category: '长文', accent: '#7a4f15', paper: '#fbf7ed', ink: '#2c2418', muted: '#716653', font: serif, heading: sans },
  { id: 'architect', name: '建筑清水', category: '杂志', accent: '#5b6770', paper: '#f4f3ef', ink: '#1f2428', muted: '#6b747c', font: sans, heading: sans },
  { id: 'signal-green', name: '信号绿', category: '技术', accent: '#16885a', paper: '#ffffff', ink: '#102018', muted: '#587064', font: sans, heading: sans },
  { id: 'paper-blue', name: '蓝边纸页', category: '长文', accent: '#235789', paper: '#f8fbff', ink: '#172433', muted: '#5d7188', font: serif, heading: serif, serif: true },
  { id: 'amber-brief', name: '琥珀快报', category: '商务', accent: '#b45309', paper: '#fffaf0', ink: '#2b2118', muted: '#756556', font: sans, heading: sans, recommended: true },
  { id: 'monochrome', name: '黑白索引', category: '通用', accent: '#111111', paper: '#ffffff', ink: '#111111', muted: '#666666', font: sans, heading: sans },
  { id: 'soft-rust', name: '锈红散文', category: '长文', accent: '#9f3a2f', paper: '#fff8f3', ink: '#2d2220', muted: '#776461', font: serif, heading: serif, serif: true }
];

export const themes: Theme[] = palettes.map(createTheme);
export const themeCategories = ['全部', ...Array.from(new Set(themes.map((theme) => theme.category)))];

export const themeMap = Object.fromEntries(themes.map((theme) => [theme.id, theme])) as Record<string, Theme>;

export const defaultThemeId = themes[0].id;
