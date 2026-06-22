export const defaultMarkdown = `![](https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&h=420&fit=crop)

# Markdown Kits

面向**微信公众号发布**的 Markdown 排版工具。左侧输入或粘贴内容，右侧实时生成可复制到公众号后台的排版 HTML。

## 核心能力

- 实时预览，主题样式自动内联
- 富文本智能粘贴，支持常见文档工具
- 图片粘贴后本地压缩并保存，刷新不丢
- 一键复制，包含 HTML 和纯文本两种剪贴板格式

## 代码示例

\`\`\`ts
const html = await renderMarkdown(markdown, themeId, imageStore);
await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
\`\`\`

## 表格

| 能力 | 状态 |
| --- | --- |
| 主题 | 20 套 |
| 历史 | 本地 20 篇 |
| 分享 | 短链 |

> 写作负责内容，排版交给工具。`;

export const maxMarkdownFileBytes = 2 * 1024 * 1024;

export function isMarkdown(text: string) {
  const patterns = [
    /^#{1,6}\s+/m,
    /\*\*[^*]+\*\*/,
    /\[[^\]]+\]\([^)]+\)/,
    /!\[[^\]]*]\([^)]+\)/,
    /^[-*+]\s+/m,
    /^\d+\.\s+/m,
    /^>\s+/m,
    /```[\s\S]*?```/,
    /^\|.*\|$/m
  ];
  return patterns.filter((pattern) => pattern.test(text)).length >= 2;
}
