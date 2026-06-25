# 模块地图

### App shell (`src/App.tsx`, `src/pages/`, `src/components/`, `src/hooks/`)
- 职责边界：`src/App.tsx` 只负责前端路由分发；`src/pages/EditorPage.tsx` 负责编辑器交互、主题搜索/分类筛选、历史/设置/分享弹窗、HTML 下载、PDF 打印视图和小红书卡片 PNG 输出；`src/pages/SharePage.tsx` 和 `src/pages/AdminPage.tsx` 负责分享页和管理页 UI；`src/components/` 承载可复用 UI 片段；`src/hooks/` 承载 toast 与主题偏好状态。不负责 Markdown 渲染细节、图片持久化细节或服务端数据写入。
- 入口：`App()`、`EditorPage()`、`SharePage()`、`AdminPage()`、`ThemeButton()`、`HistoryPanel()`、`SettingsModal()`、`ShareModal()`、`useToast()`、`useThemePrefs()`。
- 上游：`src/main.tsx` 挂载 React 应用；浏览器 URL 路径决定当前页面。
- 下游：调用 `src/lib/render.ts`、`src/lib/imageStore.ts`、`src/lib/history.ts`、`src/lib/autocorrect.ts`、`src/lib/editorHelpers.ts`、`src/lib/mermaidBlocks.ts`、`src/styles/themes.ts`，并通过 `fetch` 调用 `/api/share`、`/api/share/:id`、`/api/shares`。
- 禁止依赖：不得直接读写服务端文件；不得在组件内复制 `render.ts` 的 HTML 内联逻辑。

### Render core (`src/lib/render.ts`)
- 职责边界：负责 Markdown 预处理、`markdown-it` 渲染、HTML 净化、本地图片解析、文章主题内联、连续图片网格、剪贴板 HTML 准备；代码高亮使用 `highlight.js/lib/core` 注册常用语言，避免默认入口加载全量语言。不负责 React 状态、弹窗、路由、分享存储。
- 入口：`preprocessMarkdown()`、`createMarkdownParser()`、`applyThemeStyles()`、`renderMarkdown()`、`prepareClipboardHtml()`、`getTheme()`。
- 上游：`src/App.tsx` 编辑器预览、复制、分享页渲染；`tests/render.test.ts`。
- 下游：`markdown-it`、`highlight.js/lib/core`、`DOMPurify`、`src/styles/themes.ts`、可选 `ImageStore`。
- 禁止依赖：不得依赖 React、Express、`localStorage`、`fetch` 或页面级状态。

### Image store (`src/lib/imageStore.ts`)
- 职责边界：负责本地图片压缩、IndexedDB 保存、Blob/Object URL 读取与释放、Blob 转 Data URL、图片元数据统计和按 ID 删除。不负责 Markdown 文本插入位置，也不负责服务端上传。
- 入口：`ImageStore`、`ImageStore.listMetadata()`、`ImageStore.delete()`、`compressImage()`、`blobToDataUrl()`、`formatSize()`。
- 上游：`src/App.tsx` 的粘贴、拖拽、分享前图片转换；`src/lib/render.ts` 的本地图片解析；`tests/render.test.ts`。
- 下游：浏览器 `indexedDB`、`URL.createObjectURL`、`FileReader`、`canvas`。
- 禁止依赖：不得引入服务端文件系统或远程上传副作用。

### Local content (`src/lib/history.ts`, `src/lib/autocorrect.ts`, `src/hooks/useThemePrefs.ts`)
- 职责边界：`history.ts` 负责草稿、当前主题、本地历史记录与标题提取；`autocorrect.ts` 负责 Markdown 安全的中英文空格与标点修复；`localAssets.ts` 负责历史导入/导出结构校验、单篇 Markdown 文件名、图片引用扫描和孤儿图片判断；`useThemePrefs.ts` 负责主题收藏、隐藏和排序偏好的页面状态与 `localStorage` 持久化。
- 入口：`loadDraft()`、`saveDraft()`、`loadHistory()`、`saveHistory()`、`upsertHistory()`、`extractTitle()`、`fixCjkSpacing()`、`createHistoryExport()`、`parseHistoryImport()`、`collectReferencedLocalImageIds()`、`findOrphanImages()`、`useThemePrefs()`。
- 上游：`src/App.tsx`；`tests/render.test.ts`。
- 下游：浏览器 `localStorage`；纯字符串处理。
- 禁止依赖：不得访问分享 API；不得修改 Markdown 链接、图片、行内代码、围栏代码块内部内容。

### Themes (`src/styles/themes.ts`)
- 职责边界：定义主题元数据、分类、色彩和公众号文章内联样式，不负责应用壳视觉、不负责用户主题排序持久化。
- 入口：`themes`、`themeCategories`、`themeMap`、`defaultThemeId`、内部 `createTheme()`。
- 上游：`src/App.tsx` 主题列表/当前主题展示；`src/lib/render.ts` 内联样式；测试间接覆盖。
- 下游：`src/types.ts` 的 `Theme`/`ThemeStyles`。
- 禁止依赖：不得读取浏览器状态；不得把应用 UI 样式写进主题 schema。

### App visual layer (`src/styles.css`)
- 职责边界：负责编辑器、预览壳、弹窗、管理页、响应式布局和 TranFu 风格视觉语言。不负责文章内联样式。
- 入口：全局 CSS 类名，例如 `.app-shell`、`.theme-chip`、`.workspace`、`.preview-container`、`.share-page`、`.admin-page`。
- 上游：`src/App.tsx` 输出的 className。
- 下游：CSS 自定义属性、媒体查询、`prefers-reduced-motion`。
- 禁止依赖：不得假设文章内容靠外部 CSS 才能复制到公众号；可复制文章样式必须在 `themes.ts`/`render.ts` 内联。

### Bundle budget (`scripts/check-bundle-size.mjs`)
- 职责边界：在生产构建后读取 `dist/assets/index-*.js`，输出主入口 raw/gzip 大小，并在超过预算时让 `npm run build` 失败。不负责分析异步 chunk 内容或替代 Vite 构建报告。
- 入口：`npm run build` 自动执行；可用 `BUNDLE_MAX_MAIN_BYTES` 与 `BUNDLE_MAX_MAIN_GZIP_BYTES` 临时覆盖预算。
- 上游：开发者与 CI。
- 下游：Node `fs/promises`、`zlib`、`dist/assets`。
- 禁止依赖：不得读取源码估算大小；必须基于构建产物。

### CLI rendering (`scripts/render-markdown.ts`)
- 职责边界：为 Agent/CLI 场景提供 Markdown 到 HTML 的命令行渲染入口，通过 jsdom 提供 DOM 环境并复用 `src/lib/render.ts`。不另写 Markdown 解析、主题内联或净化逻辑。
- 入口：`npm run render:markdown -- --input article.md --output article.html [--theme classic-ink] [--fragment]`。
- 上游：开发者、Agent、自动化脚本。
- 下游：`jsdom`、`src/lib/render.ts`、`src/styles/themes.ts`、Node `fs/promises`。
- 禁止依赖：不得绕过 `renderMarkdown()` 直接拼接公众号文章 HTML。

### Share API (`server/index.ts`)
- 职责边界：负责创建分享、读取分享、删除分享、批量删除、分页/搜索/排序列出分享、TTL 过期校验、列表密码校验、存储占用统计、JSON 文件原子写入和生产静态资源托管。不负责 Markdown 渲染。
- 入口：`createShareApp()`、`startServer()`、`ShareStore`、`extractTitle()`、`resolveListPassword()`、`resolveHost()`。
- 上游：浏览器 `fetch`，生产 `node dist-server/server/index.js`，`tests/server.test.ts`，`tests/e2e/app.spec.ts`。
- 下游：Express、Node `fs/promises`、JSON 文件 `data/shares.json` 或 `SHARE_DATA_FILE`。
- 禁止依赖：不得导入前端 React 组件；生产环境不得回退默认密码；写入分享时必须保留并发队列或等价原子性。

### Tests (`tests/render.test.ts`, `tests/server.test.ts`, `tests/cli.test.ts`, `tests/e2e/`)
- 职责边界：Vitest 覆盖渲染核心、CJK 修复、主题内联、历史存储失败、图片 Object URL、Mermaid 剪贴板保留、无图表时跳过 Mermaid 加载、CLI 渲染、分享 API 密码和并发写入；Playwright E2E 覆盖桌面编辑复制主流程、移动端编辑器无横向溢出、历史导入导出、分享创建/访问/删除和移动端管理页搜索/批量删除路径。
- 入口：`npm run test`、`npm run test:e2e` 或 `npm run check`。
- 上游：开发者与 CI。
- 下游：Vitest、jsdom、Playwright、临时 HTTP server、临时文件目录。
- 禁止依赖：不得使用真实 `data/shares.json` 或真实浏览器本地数据。
