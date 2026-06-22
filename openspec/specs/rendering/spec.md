# rendering 规格

## 域定位
`rendering` 域负责把 Markdown 转成适合微信公众号粘贴的 HTML：预处理、解析、净化、主题内联、本地图片解析、图片网格、表格包裹、剪贴板准备和 CLI/Agent 渲染复用。主要实现位于 `src/lib/render.ts`，命令行入口位于 `scripts/render-markdown.ts`。

## 业务规则
- MUST 对空白 Markdown 返回空字符串。
- MUST 移除 OpenAI citation 私有标记。
- MUST 规范化断裂的 `***`、`---`、`___` 分割线。
- MUST 使用 `markdown-it` 渲染 Markdown，且 `html` 必须为 `false`。
- MUST 对渲染后的 HTML 经过 `DOMPurify.sanitize()`。
- MUST 把 Mermaid 语言围栏渲染为 `.mermaid` 容器，内容必须 HTML escape。
- MUST 对普通代码块输出 `.code-frame` 结构并尽可能使用 `highlight.js` 高亮。
- MUST 把 `local-img://<id>` 图片在有 `ImageStore` 时解析为 Object URL，并保留 `data-image-id`。
- MUST 在图片 Blob 缺失时使用占位 SVG，而不是抛出导致整篇文章不可渲染。
- MUST 对连续 2 张及以上图片生成 `.image-grid`，复制前再转成 table，提高微信兼容性。
- MUST 对表格增加横向滚动包裹，避免窄屏预览撑开布局。
- MUST 将主题样式以内联 `style` 写入文章元素。
- MUST 在剪贴板准备阶段把本地图片转为 Data URL。
- MUST 在剪贴板准备阶段保留已渲染 Mermaid SVG。
- MUST 让 CLI/Agent 渲染入口复用 `renderMarkdown()`，不得复制 Markdown 解析或主题内联逻辑。

## 场景
1. Given Markdown 包含 `- item\n: value`, When 预处理, Then 输出包含 `- item: value`。
2. Given Markdown 包含 HTML 标签, When 渲染, Then 原始标签不会以可执行 HTML 进入结果。
3. Given Markdown 包含连续图片, When 渲染, Then 预览里形成 `.image-grid`；When 复制, Then 网格转为 table。
4. Given Markdown 包含 Mermaid 代码块, When 渲染后浏览器执行 Mermaid, Then 复制准备阶段保留 SVG。
5. Given 本地图片引用缺失, When 渲染, Then 使用“图片丢失”占位图。
6. Given CLI 输入 Markdown 文件, When 运行 `npm run render:markdown`, Then 输出包含 `mk-rendered-article` 的 HTML。

## 可验证行为
- 运行 `npm run test -- tests/render.test.ts`、`npm run test -- tests/cli.test.ts` 或 `npm run check`。
- 手动验证包含标题、表格、代码块、Mermaid、连续图片的文章预览与复制。
