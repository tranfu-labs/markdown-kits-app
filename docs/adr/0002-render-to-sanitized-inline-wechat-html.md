# 0002. 将 Markdown 渲染为净化后的内联样式 HTML

## 状态
accepted

## 背景
微信公众号后台粘贴对外部 CSS、复杂布局和图片处理很敏感。原站的核心价值是复制保真，但也暴露了 HTML 安全边界较弱的问题。

## 决策
Markdown 渲染流程集中在 `src/lib/render.ts`：先预处理 Markdown，再用 `markdown-it` 渲染，关闭原始 HTML，随后用 DOMPurify 净化，再按 `src/styles/themes.ts` 的主题 schema 写入内联样式。复制前把图片网格转成 table，并把本地图片转成 Data URL。

## 后果
- 复制到公众号的 HTML 不依赖应用壳 CSS。
- 渲染安全边界比允许原始 HTML 更清晰。
- 主题新增成本较高，因为必须补齐完整内联样式 schema。
- 视觉壳调整不会自动影响公众号文章样式，后续 Agent 必须区分 `src/styles.css` 与 `src/styles/themes.ts`。
