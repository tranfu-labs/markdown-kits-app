# Markdown Kits Agent Handoff

## 当前状态
Markdown Kits 已完成一个可运行的微信公众号 Markdown 排版工具。它复刻了 `md.foolgry.top` 的核心公开行为，但实现栈已经改为 React/Vite + Express，并补了安全与稳定性边界：Markdown 原始 HTML 默认禁用、渲染结果经过 DOMPurify、分享接口有大小限制、速率限制、生产密码校验和并发写入保护。

当前主要能力：
- `/`：Markdown 编辑、实时预览、20 套主题、推荐小点、主题收藏/隐藏/排序、富文本粘贴转 Markdown、图片粘贴/拖拽、本地历史、复制到公众号、创建分享。
- `/s/:id`：公开分享阅读页，从 API 拉取内容并按主题渲染。
- `/list`：分享管理页，通过 `X-List-Password` 列出和删除分享。
- API：`POST /api/share`、`GET /api/share/:id`、`GET /api/shares`、`DELETE /api/share/:id`。

## 最新重要变更
- 主题推荐小点现在由 `src/styles/themes.ts` 的 `recommended: true` 控制。
- 已移除小点：`经典墨线`、`红线简报`、`技术蓝图`、`深度阅读`。
- 已新增小点：`陶土笔记`、`田野指南`、`线框杂志`、`银色实验室`、`琥珀快报`。
- 当前仍有小点：`财经纸页`、`陶土笔记`、`田野指南`、`线框杂志`、`银色实验室`、`琥珀快报`。
- 应用壳视觉已按 `tranfu-website-design` 迁移为中性灰 + 红色强调系统，改动集中在 `src/styles.css`。

## 关键文件入口
- `src/App.tsx`：所有页面和主要交互入口。先读这里能快速理解产品行为。
- `src/lib/render.ts`：最关键的核心链路，负责 Markdown 到微信可复制 HTML。
- `src/styles/themes.ts`：文章主题、推荐小点、主题色与内联样式。
- `src/styles.css`：应用壳视觉，不控制复制到公众号后的文章样式。
- `src/lib/imageStore.ts`：本地图片保存、压缩和复制前 Data URL 转换。
- `src/lib/history.ts`：草稿、主题、历史记录的 `localStorage` 逻辑。
- `server/index.ts`：分享 API 和 JSON 文件存储。
- `reports/md-foolgry-top-reverse-teardown.md`：原站逆向报告，做功能补齐或竞品对齐前先读。
- `docs/architecture/module-map.md`：模块边界。
- `openspec/specs/`：业务域事实规格。

## 运行与验证
常用命令：
- `npm install`
- `npm run dev`
- `npm run dev:web`
- `npm run dev:api`
- `npm run test`
- `npm run build`
- `npm run check`

本地默认端口：
- Web：`127.0.0.1:5173`
- API：`127.0.0.1:8787`

如果 `5173` 被占用，可用：
```bash
npm run dev:web -- --port 5174
```

生产注意：
- 必须设置 `LIST_PAGE_PASSWORD`。
- 默认分享数据文件是 `data/shares.json`，不要提交真实数据。

## 当前验证记录
最近一次视觉重构后已验证：
- `npm run check` 通过。
- Playwright 桌面和移动视口无 console error、无横向溢出、无过小点击目标。
- 截图目录：`/Users/hkd-xiaobei/.gstack/projects/markdown-kits/designs/tranfu-refactor-20260622/screenshots/`。

## 迭代建议
优先级较高：
- 增加端到端测试：覆盖上传图片、复制到公众号、分享创建和分享页渲染。
- 增加主题回归样本：每个主题至少验证标题、段落、引用、代码、表格、图片。
- 增强分享治理：TTL、管理搜索、分页、批量删除、内容压缩策略。
- 优化移动端工作流：编辑/预览切换、工具栏密度、长主题列表手势体验。
- 增加导入/导出：历史文章导出、单篇 `.md` 下载、复制失败的恢复路径。

谨慎处理：
- 不要轻易打开 `markdown-it` 的 `html: true`。
- 不要把公众号复制样式迁到普通 CSS。
- 不要让服务端直接参与渲染，除非同时更新架构文档和测试。
- 不要在不了解用户意图时重排全部主题或修改推荐小点名单。

## 接手流程
1. 先读根 `AGENTS.md`，确认命令、禁区和提交邮箱要求。
2. 再读 `docs/architecture/module-map.md`，找到本次任务影响的模块。
3. 读对应 `openspec/specs/<domain>/spec.md`，确认已有业务规则。
4. 复杂需求先在 `openspec/changes/<change-id>/` 写 proposal/design/tasks。
5. 修改后运行 `npm run check`；视觉改动再补桌面和移动截图检查。
