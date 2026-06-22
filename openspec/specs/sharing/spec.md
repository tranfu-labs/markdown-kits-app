# sharing 规格

## 域定位
`sharing` 域负责短链分享和管理：创建分享、读取分享、删除分享、列表页鉴权、分享数据持久化和生产静态资源服务。主要实现位于 `server/index.ts`、`src/pages/SharePage.tsx` 与 `src/pages/AdminPage.tsx`。

## 业务规则
- MUST 通过 `POST /api/share` 创建分享，body 至少包含非空 `content`，可包含 `style`。
- MAY 在创建分享时提供 `expiresAt` ISO 时间；为空时表示永久有效。
- MUST 对空内容返回 400。
- MUST 对超过 `SHARE_MAX_CHARS` 或默认 1,500,000 字符的内容返回 413。
- MUST 对格式错误的 `expiresAt` 返回 400。
- MUST 对每 IP 每分钟超过 30 次创建请求返回 429。
- MUST 为分享生成 8 字符以内的 base64url ID，并在写入前检查冲突。
- MUST 使用 `ShareStore.mutate()` 串行化写入，避免并发创建丢数据。
- MUST 通过 `GET /api/share/:id` 公开读取分享；不存在或已过期时返回 404。
- MUST 通过 `GET /api/shares` 分页列出分享摘要，并要求 `X-List-Password`。
- MUST 支持 `GET /api/shares` 的 `page`、`pageSize`、`search`、`sort` 查询参数。
- MUST 在列表响应中返回 `total`、`page`、`pageSize`、`totalPages` 和 `stats.records`、`stats.contentBytes`、`stats.jsonBytes`。
- MUST 通过 `DELETE /api/share/:id` 删除分享，并要求 `X-List-Password`。
- MUST 通过 `DELETE /api/shares` 批量删除分享，并要求 `X-List-Password` 和非空 `ids`。
- MUST 在管理页使用 session 级密码保存，不应长期写入 `localStorage`。
- MUST 在生产环境缺少 `LIST_PAGE_PASSWORD` 时拒绝启动。
- MUST 在开发环境未设置密码时使用 `dev-password` 并输出提示。
- MUST 在生产模式下通过 Express 托管 `dist` 并把前端路由回退到 `index.html`。

## 场景
1. Given 开发环境未配置密码, When API 启动, Then 列表密码为 `dev-password`。
2. Given 生产环境未配置密码, When 解析列表密码, Then 抛出包含 `LIST_PAGE_PASSWORD` 的错误。
3. Given 20 个并发创建分享请求, When 全部成功返回, Then 列表页能看到 20 条对应记录。
4. Given 管理请求缺少或密码错误, When 访问 `/api/shares` 或 DELETE, Then 返回 401。
5. Given 分享不存在, When 访问 `/api/share/:id`, Then 返回 404。
6. Given 分享设置了过去的 `expiresAt`, When 访问 `/api/share/:id`, Then 返回 404。
7. Given 多条分享存在, When 管理页按标题搜索并批量删除, Then 被选中的分享被删除且列表刷新。

## 可验证行为
- 运行 `npm run test -- tests/server.test.ts`、`npm run test:e2e` 或 `npm run check`。
- 手动启动 `npm run dev`，创建分享，访问 `/s/:id`，再用 `/list` 和密码删除。
