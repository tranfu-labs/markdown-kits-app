# md.foolgry.top 深度逆向拆解

- 产品类别: 微信公众号 Markdown 排版、复制、分享工具
- 目标站点: https://md.foolgry.top/
- 报告日期: 2026-06-22
- 结论一句话: 这是一个以纯前端编辑/渲染/复制为主、用 Go + SQLite 补足短链分享的轻量工具站；复刻时应重写 UI 和实现，但可以按其公开行为拆成渲染内核、编辑器壳、本地图片管线、分享服务四块。

## 1. Executive Takeaway

1. 站点核心价值不是“Markdown 编辑器”，而是“微信公众号兼容复制”。So what: 后续实现优先级要围绕微信后台粘贴保真度排序，`Markdown -> HTML -> 内联样式 -> 剪贴板 HTML/text` 是第一主链路。
2. 绝大多数能力可以纯前端完成，后端只负责分享和管理列表。So what: MVP 可以先做静态编辑器，分享服务作为第二阶段接入，降低部署复杂度。
3. 当前线上实现公开、轻量、可跑通，但有若干不应复刻的问题：HTML 未净化、拖拽处理函数重名、分享接口缺少限流和内容大小限制、文案与实际样式数不一致。So what: 我们要复刻功能，不要复刻这些风险。

## 2. Evidence

- 线上首页: https://md.foolgry.top/
- 公开仓库: https://github.com/foolgry/editor
- 线上响应头: `nginx/1.24.0 (Ubuntu)`, 首页 `content-type: text/html`, `last-modified: Thu, 30 Apr 2026 09:45:17 GMT`
- GitHub clone 观测到的最新提交: `1dfb577 2026-05-11 23:39:52 +0800 docs: add CHANGELOG and link from README`
- 浏览器验证: Chrome headless 实际验证了实时渲染、CJK 修复、保存历史、主题管理、分享弹窗、复制到剪贴板、移动布局。
- API 探测: `POST /api/share` 返回 201；`GET /api/share/:id` 返回 JSON；`GET /api/shares` 和 `DELETE /api/share/:id` 需要 `X-List-Password`。

## 3. Positioning Map

坐标轴来自站点实际能力:

```
高微信发布适配
   |
   |        md.foolgry.top
   |        复制保真、内联样式、图片 Base64、微信表格兼容
   |
   |
   +----------------------------- 高协作/云端内容管理
   |
   |        通用 Markdown 编辑器
   |        更偏文件编辑/预览，不解决微信粘贴细节
   |
低微信发布适配
```

当前站点在“微信发布适配”上很强，在“协作/云端管理”上很轻，只提供短链查看和密码列表页。

## 4. Product Card

| 项 | 观察 |
| --- | --- |
| Target user | 微信公众号作者、运营、AI Agent 生成文章后的排版发布流程 |
| Core promise | 粘贴 Markdown 或富文本，实时预览，多主题排版，一键复制到公众号后台 |
| Pricing signal | 未发现定价；README 标注 MIT 开源 |
| Primary strength | 微信复制链路做了很多兼容处理，包括内联样式、图片 Base64、多图 table 转换、代码块简化 |
| Visible weakness | 分享服务缺限流/大小限制，HTML 渲染安全边界弱，部分隐藏/废弃功能仍留在线上脚本里 |

## 5. Site Map And Route Map

| Route | Type | Purpose | Notes |
| --- | --- | --- | --- |
| `/` | 静态前端页面 | 编辑器主界面 | Vue 3 全局构建，无前端打包 |
| `/s/:id` | Go 动态 HTML | 分享阅读页 | 服务端把 Markdown 和 style 注入页面，前端再渲染 |
| `/list` | Go 动态 HTML | 分享管理列表 | 浏览器输入密码，密码存在 localStorage |
| `/api/share` | API POST | 创建分享 | body: `{ content, style }`; 返回 `{ id, content, style, createdAt, updatedAt }` |
| `/api/share/:id` | API GET/DELETE | 获取或删除分享 | GET 公开；DELETE 需要 `X-List-Password` |
| `/api/shares` | API GET | 列出分享 | 需要 `X-List-Password` |
| `/robots.txt` | 404 | 无 robots | nginx 404 |
| `/sitemap.xml` | 404 | 无 sitemap | nginx 404 |

## 6. UI Inventory

主界面:

- Header: 左侧 Logo + “内容排版及分享”；右侧主题管理按钮和 GitHub 链接。
- 样式横栏: “选择样式” + 20 个主题卡片；支持收藏、推荐标记、右键菜单。
- 左侧编辑器: 上传 `.md/.markdown`、富文本智能粘贴提示、修复空格、字符数、textarea。
- 右侧预览: 公众号预览、收藏当前主题、分享、历史、保存、复制到公众号。
- 历史侧边栏: 最多 20 篇，显示标题、更新时间、主题，支持加载和删除。
- 分享弹窗: 展示生成的 `/s/:id` 链接，支持复制和打开。
- 主题管理弹窗: 已显示/已隐藏两个区域，拖拽排序，恢复默认排序。
- 右键菜单: 收藏主题、隐藏/显示主题、打开主题管理。
- 小红书模式: UI 和方法存在，但入口整体注释隐藏。

移动端:

- 390px 视口下 `#app` 仍是 100vh。
- Header 高约 49px，样式栏高约 49px。
- 编辑器压缩到约 163px 高，预览占剩余约 584px。
- `.main-content` 使用 `display: contents`，页面本身不滚动，编辑和预览区域内部滚动。

## 7. Feature Matrix

| Feature | Current coverage | Implementation signal | Us / Opportunity |
| --- | --- | --- | --- |
| Markdown 实时预览 | Yes | `markdown-it@14`, watch `markdownInput` | 必做 P0，加快防抖和错误边界 |
| 20 个主题 | Yes | `styles.js` 的 `STYLES` 对象 | 必做 P0，建议做主题 schema 和预览缩略 |
| 微信复制 | Yes | `ClipboardItem` 写 `text/html` + `text/plain` | 必做 P0，用自动化测试覆盖 HTML 结构 |
| 图片粘贴/本地存储 | Yes | Canvas 压缩 + IndexedDB + `img://id` | 必做 P0，修复拖拽函数重名 |
| 多图网格 | Yes | 连续图片转 `.image-grid`，复制时转 table | 必做 P0，单测 2/3/4/5+ 张图 |
| 智能粘贴富文本 | Yes | Turndown + IDE 检测 | P0/P1，先覆盖飞书/Notion/Word 常见样本 |
| CJK 空格修复 | Yes | `autocorrect.js` | P0，按钮触发即可 |
| Mermaid | Yes | `mermaid@10`, `securityLevel: loose` | P1，安全性需收紧或净化 |
| 历史记录 | Yes | localStorage，最多 20 篇 | P0，建议支持导出/清空 |
| 主题收藏/隐藏/排序 | Yes | localStorage: `starredStyles`, `hiddenStyles`, `styleOrder` | P1，MVP 可先只做选择和收藏 |
| 分享短链 | Yes | Go + SQLite | P1，需加限流、大小限制、TTL/删除策略 |
| 分享管理列表 | Yes | `/list` + `X-List-Password` | P2，管理员功能 |
| 小红书图片 | Hidden/partial | html2canvas 750x1000，多页下载 | P2，作为 feature flag |
| CLI/Skill | Repo has it, site does not expose | `wxmd-cli` 复用 `render-core.js` | 非网站 MVP，可后置 |

## 8. Actual Style List

线上实际 20 个主题:

1. `wechat-default` - 默认公众号风格
2. `latepost-depth` - 晚点风格
3. `wechat-ft` - 金融时报
4. `wechat-anthropic` - Claude
5. `wechat-claude-song` - Claude Song
6. `wechat-tech` - 技术风格
7. `wechat-elegant` - 优雅简约
8. `wechat-deepread` - 深度阅读
9. `wechat-nyt` - 纽约时报
10. `wechat-jonyive` - Jony Ive
11. `wechat-medium` - Medium 长文
12. `wechat-apple` - Apple 极简
13. `kenya-emptiness` - 原研哉·空
14. `hische-editorial` - Hische·编辑部
15. `ando-concrete` - 安藤·清水
16. `gaudi-organic` - 高迪·有机
17. `kami` - Kami
18. `guardian` - Guardian 卫报
19. `nikkei` - Nikkei 日経
20. `lemonde` - Le Monde 世界报

注: 首页 placeholder 和默认示例里仍写“13 种样式”，这是文案过期。

## 9. Frontend Architecture

脚本加载顺序:

1. CDN: `markdown-it@14.0.0`
2. CDN: `@highlightjs/cdn-assets@11.9.0`
3. CDN: `mermaid@10`
4. Local: `lib/autocorrect.js`
5. CDN: `turndown@7.2.0`
6. CDN: `vue@3.4.15/dist/vue.global.prod.js`
7. CDN: `html2canvas@1.4.1`
8. Local: `styles.js`
9. Local: `modules/image-store.js`
10. Local: `modules/image-compressor.js`
11. Local: `modules/image-host-manager.js`
12. Local: `modules/text-utils.js`
13. Local: `lib/autocorrect.js?v=18` again
14. Local: `render-core.js`
15. Local: `modules/editor-methods.js`
16. Local: `app.js`

Notes:

- `lib/autocorrect.js` 被加载两次。
- Vue 使用全局生产构建，没有 Vite/Webpack。
- 业务方法在 `EditorMethods` 对象中混入 Vue app。
- `render-core.js` 同时支持浏览器全局和 CommonJS，供 CLI/测试复用。

## 10. Render Pipeline

主链路:

1. `markdownInput` 变化触发 watcher。
2. `preprocessMarkdown`:
   - 移除 OpenAI/检索链路残留 citation 私有字符。
   - 规范化 `***`, `---`, `___` 分割线。
   - 清理断裂加粗、连续星号/下划线。
   - 修复飞书等复制导致的列表冒号换行。
3. `markdown-it` 渲染:
   - `html: true`
   - `linkify: true`
   - `typographer: false`
   - 自定义 code highlight 和 Mermaid fence。
4. Patch `scanDelims`:
   - 改善 CJK 与 `_/*/~` 强调符解析。
   - 允许中文开括号类标点后继续强调。
5. `processImageProtocol`:
   - 把 `img://id` 从 IndexedDB 取出，换成 Object URL。
   - 加 `data-image-id` 供复制时转 Blob/Base64。
6. `applyInlineStyles`:
   - 按当前主题对元素写 inline style。
   - 标题内 strong/em/a/code 等继承标题颜色。
   - 连续图片分组为 CSS grid。
   - 表格包裹 `.table-wrapper`，窄屏横向滚动。
7. DOM 更新后 `mermaid.run()`。

## 11. Copy Pipeline

`copyToClipboard` 的关键处理:

1. 解析当前 `renderedContent`。
2. `.image-grid` 转 table，以提高公众号兼容性。
3. 所有图片转 Base64:
   - `data-image-id` 优先从 IndexedDB 取 Blob。
   - 否则尝试 CORS fetch 外链。
4. 如果主题容器有非白背景，外层包一层 `section`，并迁移背景和 padding。
5. 代码块简化成更稳定的 `pre > code`。
6. `li` 文本扁平化，避免复杂嵌套在微信里错乱。
7. 引用块改成半透明黑底/黑字，试图适配微信深色模式。
8. 用 `ClipboardItem` 同时写入 `text/html` 和 `text/plain`。
9. 复制成功后自动保存到历史记录。

浏览器验证结果:

- 复制按钮变成“✓ 已复制”。
- 剪贴板可读出 plain text，包含标题、段落、表格和 Mermaid 源文本。

## 12. Paste And Image Pipeline

智能粘贴:

- 优先处理 `clipboardData.files` 或 `clipboardData.items` 中的图片。
- HTML 富文本使用 Turndown 转 Markdown。
- 检测 IDE/代码编辑器 HTML，避免把代码误转义。
- 检测 `[Image #2]` 之类占位符，阻止插入无用文本。
- 本地 `file:///` 图片提示用户拖拽文件。

图片上传:

- 限制 `image/*`。
- 单图最大 10MB。
- Canvas 压缩，最大宽高 1920，质量 0.85。
- GIF 和 SVG 不压缩。
- PNG 保持 PNG，其它默认 JPEG。
- 压缩后若更大则保留原文件。
- 写入 IndexedDB: `WechatEditorImages/images`。
- Markdown 中插入 `![name](img://img-timestamp-random)`。

Important bug:

- `editor-methods.js` 中定义了两个同名 `handleDrop`。
- 后定义的主题拖拽版本会覆盖前面的图片拖拽版本。
- 模板中 textarea 的 `@drop="handleDrop"` 因此可能不会处理图片文件。
- 复刻时应拆成 `handleEditorDrop` 和 `handleStyleDrop`。

## 13. Local Data Model

localStorage:

| Key | Shape | Purpose |
| --- | --- | --- |
| `currentStyle` | string | 当前主题 |
| `markdownInput` | string | 上次编辑内容 |
| `starredStyles` | stringified array | 收藏主题 |
| `articleHistory` | `{ articles: Article[] }` | 最多 20 篇历史 |
| `hiddenStyles` | stringified array | 隐藏主题 |
| `styleOrder` | stringified array | 主题排序 |
| `wx-editor-list-password` | string | `/list` 管理密码缓存 |

Article:

```json
{
  "id": "article-{timestamp}-{random}",
  "title": "从 # 标题或前 20 字提取",
  "content": "markdown",
  "style": "wechat-default",
  "createdAt": 1782111926109,
  "updatedAt": 1782111926109
}
```

IndexedDB:

- DB: `WechatEditorImages`
- Version: `1`
- Store: `images`
- Key: `id`
- Indexes: `createdAt`, `name`
- Stored fields: `id`, `blob`, `name`, `originalSize`, `compressedSize`, `createdAt`, plus metadata.

## 14. Backend Architecture

Repo layout:

- `frontend/`: 静态页面和脚本。
- `server/main.go`: Go HTTP 服务。
- `server/data/shares.db`: SQLite 数据库位置。
- `docker-compose.yml`: 后端容器暴露到 `127.0.0.1:3000:8080`，挂载 `server/data` 和 `frontend`。
- `nginx/md-editor.conf`: `/` 走静态文件，`/api`, `/s`, `/list` 代理到 Go。

SQLite table:

```sql
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  style TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shares_created_at ON shares(created_at);
```

Environment:

- `LIST_PAGE_PASSWORD`: 必填，否则服务启动失败。
- `CORS_ORIGINS`: 逗号分隔；默认 `http://localhost:8080`, `http://localhost:3000`。
- `PORT`: 默认 8080。

## 15. API Contract

Create share:

```http
POST /api/share
Content-Type: application/json

{
  "content": "# title",
  "style": "wechat-default"
}
```

Success:

```json
{
  "id": "63132ca6",
  "content": "# title",
  "style": "wechat-default",
  "createdAt": "2026-06-22T07:01:58.587415803Z",
  "updatedAt": "2026-06-22T07:01:58.587415803Z"
}
```

Get share:

```http
GET /api/share/{id}
```

Delete share:

```http
DELETE /api/share/{id}
X-List-Password: {password}
```

List shares:

```http
GET /api/shares
X-List-Password: {password}
```

List response:

```json
{
  "items": [
    {
      "id": "63132ca6",
      "title": "test",
      "style": "wechat-default",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "count": 1
}
```

Observed statuses:

- `GET /api/share` -> 405
- `POST /api/share` -> 201
- `GET /api/share/{id}` -> 200 or 404
- `PUT /api/share/{id}` -> 405
- `DELETE /api/share/{id}` without password -> 401
- `GET /api/shares` without password -> 401
- `OPTIONS /api/share` -> 200

## 16. Sharing Page

`/s/:id` behavior:

- Go queries SQLite, generates an HTML page.
- Page title and meta description are extracted from Markdown and escaped.
- Markdown and style are embedded with `json.Marshal`, which makes JS string injection safer.
- The page loads `/render-core.js` and `/styles.js`, then renders on client.
- It has CSS for header/footer/copy actions, but current body only includes main content; `copyContent` method exists but no visible button uses it.

## 17. Pricing / Packaging Read

- Public website has no pricing page, no login, no paywall.
- GitHub README indicates MIT license.
- Sharing admin is a single password gate, not user accounts.
- Operational packaging is Docker Compose + Nginx; frontend-only deployment is explicitly supported when sharing is not needed.

## 18. UX / Messaging Notes

1. First screen is the actual tool, not a landing page.
2. Main copy speaks to WeChat publishing: “复制到公众号”, “公众号预览”, “飞书、Notion、Word 粘贴自动转 Markdown”。
3. Theme breadth is a major selling point, but “13 种样式”文案已过期，实际是 20 种。
4. GitHub link is prominent, reinforcing open-source trust.
5. History is local and invisible until opened; this keeps primary workflow focused.
6. Hidden 小红书 UI suggests roadmap ambition, but current user-facing product is still公众号-first。

## 19. Security And Product Risks

| Risk | Evidence | Recommendation |
| --- | --- | --- |
| Raw HTML allowed | `markdown-it` uses `html: true`; rendered with `v-html` | Use DOMPurify or disable raw HTML by default |
| Mermaid loose security | `securityLevel: 'loose'` | Use stricter config or sanitize diagrams |
| Public share creation abuse | `POST /api/share` has no auth/rate limit/body limit | Add rate limit, max content size, captcha or signed quota if public |
| SQLite growth | No TTL cleanup found | Add retention policy, admin delete, storage monitoring |
| Short ID collision | `uuid.New().String()[:8]`; DB PK but no retry | Retry on collision or use longer IDs |
| Huge base64 images in shares | Local images converted to data URLs before sharing | Limit request body and image count/size |
| Admin password in localStorage | `/list` caches password without expiry | Use sessionStorage or expiring token |
| Function name collision | Two `handleDrop` methods | Split editor/file drop and theme drop |
| External CDN dependency | Multiple CDN scripts | Pin with SRI or self-host for reliability |
| Demo images external | Unsplash default article images | Use local demo assets or no external default images |

## 20. Recommended Implementation Plan

### 30 days / MVP

Acceptance criteria:

- 左右分栏编辑器可输入 Markdown 并实时预览。
- 至少实现 6 个主题，主题系统可扩展到 20 个。
- 复制到公众号可写入 `text/html` 和 `text/plain`。
- CJK 空格修复可用。
- localStorage 保存当前内容和当前主题。
- 基础历史记录可保存/加载/删除。

Implementation:

1. 写 `render-core`: Markdown 预处理、parser、inline style、表格 wrapper、多图 grid。
2. 写 `styles` registry: 用 schema 管理主题，不直接散落字符串。
3. 写主 UI: header、style rail、editor、preview、toast。
4. 写复制管线: HTML/text clipboard，先不做复杂图片。
5. 写 Playwright 测试: 桌面/移动、主题切换、复制成功、历史保存。

### 90 days / Full parity

Acceptance criteria:

- 20 个主题全部完成。
- 粘贴/拖拽图片，压缩后存 IndexedDB，渲染 `img://id`。
- 富文本智能粘贴支持飞书/Notion/Word 常见格式。
- 复制时图片转 Base64，多图 grid 转 table。
- 分享 API、分享页、管理列表可部署。

Implementation:

1. 加 `ImageStore`, `ImageCompressor`, `SmartPaste`。
2. 加 Go/Node 后端均可的 share service。
3. 加 SQLite/Postgres schema，限制 body size 和 rate limit。
4. 加 `/s/:id`, `/list`, `/api/share`, `/api/shares`。
5. 加安全净化层和内容大小限制。

### 180 days / Better than parity

Acceptance criteria:

- 主题预览缩略图/搜索/分类。
- 历史记录导入导出。
- 多平台输出: 公众号、小红书长图、普通 HTML、PDF。
- 分享可设置过期、密码、删除链接。
- CLI/Agent 接口复用同一个 render core。

## 21. Test Matrix For Our Build

| Area | Test |
| --- | --- |
| Markdown | h1-h6, list, nested list, quote, hr, table, code, inline code, links, images |
| CJK emphasis | 中文前后 `_`, `*`, `~`，中文括号后的强调 |
| WeChat copy | Clipboard HTML includes inline style, plain text fallback exists |
| Images | paste PNG/JPEG/GIF/SVG, >10MB rejection, IndexedDB reload, Base64 copy |
| Multi-image | 2/3/4/5/9 images layout and table conversion |
| Smart paste | Feishu/Notion/Word HTML, IDE copied code, local file path image |
| Themes | all styles apply to h1/h2/p/blockquote/table/code/img |
| Persistence | current content, style, history, favorites, hidden styles, order |
| Share | create/get/list/delete, invalid id, missing password, oversize content |
| Responsive | 390x844, 768px, 1024px, 1440px |
| Security | raw HTML scripts/events, malicious links, SVG/data URL, Mermaid payloads |

## 22. Do Not Copy Blindly

- Do not copy the exact branding, logo, theme names tied to third-party brands, or demo assets unless license and product positioning allow it.
- Do not keep raw HTML rendering without sanitization.
- Do not reuse the same `handleDrop` method name collision.
- Do not ship public share creation without rate limits and content limits.
- Do not keep “13 styles” copy when actual style count differs.

## 23. Minimal Clone Spec

For the next build, the minimum same-function website is:

- A single-page Markdown editor with live WeChat-style preview.
- A theme registry with inline style output.
- CJK text formatter.
- Smart paste from rich text to Markdown.
- Local image paste/compress/store/render/copy.
- One-click copy to WeChat-compatible clipboard HTML.
- Local history and theme preferences.
- Optional share backend with `/api/share`, `/api/share/:id`, `/s/:id`, `/list`.

This is the smallest architecture that preserves the actual value of md.foolgry.top without inheriting avoidable implementation debt.
