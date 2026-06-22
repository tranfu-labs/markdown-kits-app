# Markdown Kits Development Plan 2

## 状态
Draft

## 背景
Markdown Kits 当前已经具备可运行的微信公众号 Markdown 排版主链路：编辑、实时预览、20 套主题、本地图片、历史记录、复制到公众号、分享短链和管理列表。现有实现已经比逆向目标站补上了关键安全边界：Markdown 原始 HTML 默认禁用、渲染结果经 DOMPurify 净化、分享接口有大小限制、限流、生产密码校验和并发写入保护。

下一阶段不应优先继续堆功能，而应把“复制到公众号保真”这条核心链路做成可回归、可发布、可扩展的产品底座。

## 当前事实
- 前端栈：React 19 + Vite 8 + TypeScript 6。
- 后端栈：Express 5 + JSON 文件分享存储。
- 核心渲染：`src/lib/render.ts`，负责 Markdown 预处理、HTML 净化、主题内联、本地图片解析、图片网格和剪贴板 HTML。
- 核心交互：`src/App.tsx` 负责路由分发；`src/pages/EditorPage.tsx`、`src/pages/SharePage.tsx`、`src/pages/AdminPage.tsx` 负责页面；`src/components/` 和 `src/hooks/` 承载组件与本地 UI 状态。
- 本地内容：`src/lib/history.ts`、`src/lib/imageStore.ts`、`src/lib/autocorrect.ts`、`src/lib/localAssets.ts`。
- 业务规格：`openspec/specs/` 已覆盖 editor、rendering、local-content、themes、sharing、visual-design。
- 架构决策：`docs/adr/0001-current-architecture-baseline.md` 和 `docs/adr/0002-render-to-sanitized-inline-wechat-html.md` 已确认当前架构方向。

## 最新验证
- 当前迭代后 `npm run check` 通过：Vitest 20 个测试通过，生产构建通过，主入口 bundle budget 通过。
- 当前迭代后 `npm run test:e2e` 通过：Playwright Chromium 6 条浏览器路径通过。
- `npm outdated --json` 返回空对象，当前 npm registry 视角无可升级依赖。
- `npm audit` 和 `npm audit --omit=dev` 均为 0 vulnerabilities。
- `vite build` 通过；经懒加载和 highlight.js core 化后，主入口 bundle 约 427KB，gzip 约 151KB，并由 `scripts/check-bundle-size.mjs` 在构建后检查。

## 当前迭代进展
- Phase 1 已推进：引入 Playwright E2E，覆盖桌面编辑复制、移动端、Markdown 文件上传、富文本粘贴、图片粘贴、分享创建/访问/删除、历史导入导出；渲染 fixture 和剪贴板结构断言已补强。
- Phase 2 已推进：`src/App.tsx` 已收敛为路由壳，页面位于 `src/pages/`，组件位于 `src/components/`，toast 与主题偏好位于 `src/hooks/`。
- Phase 3 已推进：`/s/:id` 和 `/list` 懒加载，Mermaid 仅在页面存在 `.mermaid` 时动态加载，`highlight.js` 改为 core + 常用语言注册，主入口 bundle budget 已接入构建。
- Phase 4 已推进：历史 JSON 导出/导入、单篇 `.md` 下载、清空历史、本地图片占用估算、孤儿图片清理已实现并有测试覆盖。
- Phase 5 已推进：分享 TTL、分页/搜索/排序、批量删除、sessionStorage 管理密码、存储统计已实现；管理页移动端搜索与批量删除已由 E2E 覆盖；新增 ADR 0003 记录 JSON 存储治理和增长路径。
- Phase 6 已推进：主题搜索/分类/缩略预览、移动端编辑/预览切换、复制失败诊断、普通 HTML 下载、PDF 打印视图、小红书卡片 PNG、CLI/Agent 渲染入口已实现；新增 `openspec/changes/phase6-output-expansion/` 记录设计。
- Phase 0 已推进：`.gitignore`、noreply git 邮箱和 `npm run check` 已确认，本地基线提交已创建。

## 主要问题
1. 浏览器端核心真实用户路径已有自动化回归；后续可继续扩展更细的异常路径，例如超大文件拒绝和剪贴板权限失败。
2. `src/App.tsx` 已拆成路由壳，后续风险主要集中在 `src/pages/EditorPage.tsx` 继续增长。
3. 首屏 bundle 已明显下降，且无 Mermaid 内容时不会加载 Mermaid；Mermaid 相关异步 chunk 仍较大，后续可继续分析 Mermaid 细分加载。
4. 分享治理已具备 TTL、分页、搜索、批量删除和存储占用可视化，后续重点是部署规模变大时替换 JSON 存储。
5. 本地历史和图片已具备导入、导出、存储用量和孤儿图片清理，后续可继续扩展图片明细视图。
6. 当前工作树已形成本地稳定基线；后续正式协作可基于该提交继续迭代。

## 成功指标
- 核心编辑与复制路径有 E2E 覆盖，后续改渲染或 UI 时能快速发现回归。
- 默认编辑器首屏 bundle 明显下降，非首屏功能按需加载。
- `src/App.tsx` 被拆分到页面、组件和 hooks，业务边界更接近 `docs/architecture/module-map.md`。
- 用户可导出和恢复本地历史，能够清理无用本地图片。
- 分享管理页能支撑公开部署下的基本运维。
- 所有变更保持 `npm run check` 通过，并同步更新受影响的 openspec/ADR。

## 范围
### In Scope
- 自动化测试补强。
- 前端页面和组件拆分。
- bundle 性能优化。
- 本地内容导入、导出、清理。
- 分享管理治理。
- 对应 spec/ADR 更新。

### Out of Scope
- 打开 `markdown-it` 的 `html: true`。
- 把公众号文章样式迁移到应用壳 CSS。
- 引入用户账号体系。
- 服务端参与 Markdown 渲染。
- 大规模主题重排或修改推荐小点名单，除非另有明确产品需求。

## 阶段计划
### Phase 0: Git 与发布基线
目标：让后续迭代有明确起点。

任务：
- 确认 `.gitignore` 覆盖 `dist/`、`data/shares.json`、`tsconfig.tsbuildinfo`、`.env*`。
- 运行 `npm run check`。
- 如果需要提交，先确认 `git config user.email` 为 `253661133+BruceL017@users.noreply.github.com`。
- 创建基线提交。

验收：
- 工作树只包含预期文件。
- 基线提交 author email 为 noreply。
- `npm run check` 通过。

### Phase 1: 回归底座
目标：守住“编辑 -> 预览 -> 复制到公众号”的核心价值。

任务：
- 引入 Playwright E2E。
- 覆盖桌面主流程：输入 Markdown、主题切换、保存历史、复制到公众号。
- 覆盖移动视口：打开 `/` 后无横向溢出，主要按钮可点击。
- 覆盖分享流程：创建分享、打开 `/s/:id`、管理页加载并删除。
- 增加渲染 fixtures：标题、段落、引用、表格、代码块、Mermaid、连续图片、本地图片缺失。
- 对 `prepareClipboardHtml()` 增加结构级断言：图片网格转 table、本地图片转 Data URL、Mermaid SVG 保留。

验收：
- `npm run check` 通过。
- 新增 E2E 可在本地稳定运行。
- 复制 HTML 的关键结构有自动化断言。

### Phase 2: 结构拆分
目标：降低 `src/App.tsx` 后续迭代成本。

建议拆分：
- `src/pages/EditorPage.tsx`
- `src/pages/SharePage.tsx`
- `src/pages/AdminPage.tsx`
- `src/components/ThemeButton.tsx`
- `src/components/HistoryPanel.tsx`
- `src/components/SettingsModal.tsx`
- `src/components/ShareModal.tsx`
- `src/hooks/useToast.ts`
- `src/hooks/useThemePrefs.ts`

约束：
- 不改变现有业务行为。
- 不把 `render.ts` 的 HTML 处理逻辑复制进组件。
- 不让 `render.ts` 依赖 React、fetch、localStorage 或 Express。

验收：
- `src/App.tsx` 只保留路由分发和少量壳逻辑。
- 现有 Vitest 和新增 E2E 全部通过。
- `docs/architecture/module-map.md` 与实际模块边界一致。

### Phase 3: 性能优化
目标：减少默认编辑器首屏成本。

任务：
- 对 `/s/:id` 和 `/list` 页面做懒加载。
- 仅当内容包含 Mermaid fence 或页面存在 `.mermaid` 时加载 Mermaid。
- 将 `highlight.js` 全量导入改为 core + 常用语言注册，或按语言动态加载。
- 配置 bundle size budget，构建时显式暴露主入口大小变化。
- 检查 `vite build` 产物，确认 Mermaid 相关 chunk 不影响默认编辑器首屏路径。

验收：
- 主入口 bundle 明显下降。
- Mermaid、分享页、管理页保持功能正常。
- `npm run check` 通过。

### Phase 4: 本地内容资产能力
目标：让用户能恢复、迁移和清理本地内容。

任务：
- 历史记录导出 JSON。
- 历史记录导入 JSON，并校验数据结构。
- 单篇文章下载为 `.md`。
- 增加“清空历史”入口。
- 增加本地图片存储用量估算。
- 增加孤儿图片清理：扫描草稿和历史中的 `local-img://<id>`，删除未引用图片。

验收：
- 用户可以导出后重新导入历史。
- 清理图片不会删除草稿或历史仍引用的图片。
- localStorage 或 IndexedDB 失败时 UI 有明确 toast。
- `local-content` spec 同步更新。

### Phase 5: 分享治理升级
目标：让轻量分享服务更适合公开部署。

任务：
- 分享记录增加可选 TTL/过期时间。
- `/api/shares` 支持分页、搜索和排序。
- `/list` 增加搜索框、分页控件、批量删除。
- 管理密码从长期 localStorage 改为 sessionStorage，或增加过期时间。
- 增加分享存储占用和记录数展示。
- 评估分享内容压缩策略，降低 Data URL 大图对 JSON 文件的压力。
- 若要支持多实例部署，新增 ADR，讨论 JSON 文件升级 SQLite/Postgres。

验收：
- API 测试覆盖 TTL、分页、搜索、删除。
- 管理页在移动端仍可用，不出现横向破版。
- `sharing` spec 同步更新。
- 生产环境缺少 `LIST_PAGE_PASSWORD` 仍拒绝启动。

### Phase 6: 产品增强
目标：在不扰乱公众号主链路的前提下扩展输出场景。

候选能力：
- 主题搜索、分类和缩略预览。
- 移动端编辑/预览切换。
- 复制失败诊断，明确提示浏览器 Clipboard API 限制。
- 输出普通 HTML。
- 输出长图或小红书卡片。
- 输出 PDF。
- CLI/Agent 渲染入口，复用 `src/lib/render.ts`。

验收：
- 新输出能力默认不影响公众号复制。
- 每项新增能力都有独立入口和回归测试。
- 复杂能力通过 `openspec/changes/<change-id>/` 先设计再实现。

## 推荐第一刀
优先做 Phase 1：E2E 与渲染 fixture。
理由：这个项目的护城河是“复制到公众号保真”，而这件事当前还缺浏览器级自动化回归。先把核心路径守住，再做拆分、性能和产品增强，风险最低。

## 风险与处理
- 风险：E2E 复制测试在不同浏览器权限下不稳定。
  处理：优先测试 `prepareClipboardHtml()` 的结构输出，浏览器剪贴板只覆盖成功路径和 fallback 文案。

- 风险：拆分组件时误改状态流。
  处理：先补 E2E，再拆；拆分阶段只移动代码，不改业务逻辑。

- 风险：性能优化误伤 Mermaid 或代码高亮。
  处理：使用 fixture 覆盖 Mermaid、TS 代码块、未知语言代码块。

- 风险：分享 TTL 会影响现有分享链接。
  处理：TTL 字段默认空，旧数据默认永久有效。

- 风险：本地图片清理误删。
  处理：先实现 dry-run 统计，再提供确认清理；测试覆盖草稿和历史引用。

## 开发注意事项
- 修改渲染链路前先读 `openspec/specs/rendering/spec.md`。
- 修改主题前先读 `openspec/specs/themes/spec.md`。
- 修改分享 API 前先读 `openspec/specs/sharing/spec.md`。
- 视觉改动后至少检查桌面和 390px 移动视口。
- 文档或规格变更要同步 handoff、openspec 或 ADR，避免后续 Agent 读到过期事实。
