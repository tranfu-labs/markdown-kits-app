# Markdown Kits · AI 项目操作手册

## 项目概览
Markdown Kits 是一个面向微信公众号发布的 Markdown 排版、预览、复制和短链分享工具。当前技术栈为 React 19 + Vite 8 + TypeScript 6 前端，Express 5 API 后端，渲染链路使用 `markdown-it`、`DOMPurify`、`highlight.js`、`mermaid`、`turndown`，样式主题以 TypeScript 配置生成内联 HTML。

## 项目结构
- `src/App.tsx`：主应用壳，包含 `/` 编辑器、`/s/:id` 分享页、`/list` 分享管理页。
- `src/lib/render.ts`：Markdown 预处理、HTML 净化、主题内联、图片网格、剪贴板 HTML 准备。
- `src/lib/imageStore.ts`：浏览器 IndexedDB 图片保存、Object URL 缓存、Canvas 压缩、Data URL 转换。
- `src/lib/history.ts`：本地草稿与历史记录，基于 `localStorage`。
- `src/lib/autocorrect.ts`：中英文间距和常见中文标点修复。
- `src/styles/themes.ts`：20 套公众号文章主题的 schema、色彩、内联样式、推荐标记。
- `src/styles.css`：应用视觉层，当前是 TranFu 风格迁移后的中性灰 + 红色强调系统。
- `server/index.ts`：分享 API、分享列表鉴权、JSON 文件存储、生产静态资源托管。
- `tests/render.test.ts`：渲染、历史、图片 URL、Mermaid 剪贴板行为测试。
- `tests/server.test.ts`：分享 API、生产密码、并发写入测试。
- `reports/md-foolgry-top-reverse-teardown.md`：对原站 `md.foolgry.top` 的逆向拆解报告。
- `docs/architecture/module-map.md`：模块边界与依赖方向。
- `openspec/specs/`：当前业务域事实规格。
- `openspec/changes/`：后续需求先设计再实现的变更工作区。
- `docs/adr/`：架构决策记录。

## 常用命令
- 安装依赖：`npm install`
- 同时启动 API 和 Web：`npm run dev`
- 只启动 API：`npm run dev:api`
- 只启动 Vite Web：`npm run dev:web`
- 构建：`npm run build`
- 生产预览：`npm run preview`
- 测试：`npm run test`
- 全量检查：`npm run check`

运行端口：
- Vite 默认 `127.0.0.1:5173`，代理 `/api` 到 `127.0.0.1:8787`。
- API 默认 `127.0.0.1:8787`，生产环境 `HOST` 默认 `0.0.0.0`。
- 生产环境必须设置 `LIST_PAGE_PASSWORD`，否则服务启动会抛错。
- 可用 `SHARE_DATA_FILE` 指定分享数据文件，默认写入 `data/shares.json`。
- 可用 `SHARE_MAX_CHARS` 指定分享内容字符上限，默认 `1500000`。

## 编码规范
- TypeScript 严格模式开启，配置见 `tsconfig.json`。
- 源码为 ESM，`package.json` 设置 `"type": "module"`。
- React 使用函数组件和 Hooks；现有代码主要集中在 `src/App.tsx`，新增抽象前先确认是否真的降低复杂度。
- 手动编辑文件时保持现有两空格缩进、单引号、分号、中文 UI 文案风格。
- 没有独立 ESLint/Prettier 配置；以 `npm run check` 的 `tsc -b`、`vitest run`、`vite build` 作为当前硬门槛。
- 主题样式必须通过 `src/styles/themes.ts` 的 `ThemeStyles` schema 输出内联样式，避免在渲染结果里依赖外部 CSS。
- 前端视觉调整优先改 `src/styles.css`；文章内容样式调整优先改 `src/styles/themes.ts`。
- GitHub commit 只能在用户明确要求时执行。提交前必须确认 `git config user.email` 为 `253661133+BruceL017@users.noreply.github.com`，提交后用 `git log -1 --format='%ae'` 验证，不得使用真实邮箱。

## 修改前检查
- 读 `docs/architecture/module-map.md` 确认依赖边界。
- 读相关 `openspec/specs/<domain>/spec.md`。
- 确认禁止依赖未被破坏。

## 修改后检查
- 跑 `npm run check`；若只改文档，可至少跑文档自查命令并说明未跑构建的原因。
- 更新受影响的 spec 与 ADR。
- 必要时在 `openspec/changes/` 记录变更。

## 禁止事项
- 不要绕过 `src/lib/render.ts` 直接在 UI 中拼接公众号复制 HTML。
- 不要让 `src/lib/render.ts` 依赖 React 组件、浏览器页面状态或服务端模块。
- 不要把本地 IndexedDB 图片 Blob 写入服务端；分享前只能转成 Data URL 或外链。
- 不要在生产环境使用默认列表密码；`LIST_PAGE_PASSWORD` 必须显式设置。
- 不要提交 `data/shares.json`、密钥、真实用户内容、浏览器截图临时文件或构建产物。
- 不要把主题推荐小点写死在 CSS；入口是 `src/styles/themes.ts` 的 `recommended` 元数据。
- 不要在未确认业务意图时删除 `reports/md-foolgry-top-reverse-teardown.md`，它是复刻目标和风险来源记录。
