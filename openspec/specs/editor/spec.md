# editor 规格

## 域定位
`editor` 域负责主编辑体验：Markdown 输入、富文本粘贴转换、图片粘贴/拖拽入口、`.md` 文件导入、主题选择、预览触发、历史/设置/分享/复制入口。主要实现位于 `src/pages/EditorPage.tsx`，路由入口位于 `src/App.tsx`。

## 业务规则
- MUST 在 `/` 路径展示编辑器，在 `/s/:id` 展示分享页，在 `/list` 展示分享管理页。
- MUST 对小于等于 2MB 的 `.md`/`.markdown` 文件读取文本并替换当前编辑内容。
- MUST 拒绝超过 2MB 的 Markdown 文件并展示错误 toast。
- MUST 在粘贴图片或拖拽图片到编辑器时保存图片，并向 Markdown 插入 `local-img://<id>` 图片引用。
- MUST 拒绝非图片文件作为图片输入；MUST 拒绝超过 10MB 的图片。
- MUST 在粘贴富文本且纯文本不像 Markdown 时，使用 Turndown 转成 Markdown 后插入。
- MUST 在 Markdown 或主题变化后触发预览渲染，并避免旧异步渲染结果覆盖新内容。
- MUST 在复制成功后尝试保存历史记录；历史保存失败时仍视为剪贴板复制成功。
- MUST 在 HTML 复制失败时提示可能的剪贴板权限或安全上下文问题，并尽量回退复制 Markdown 文本。
- MUST 允许主题收藏、隐藏、上下移动排序，并写入 `localStorage`。
- MUST 允许按主题名称、ID 或分类搜索主题，并允许按主题分类筛选。
- MUST 让当前主题即使被隐藏也仍显示在可选主题列表中。
- MUST 在内容为空时阻止保存和分享。
- MUST 在移动视口提供编辑/预览切换，避免编辑器和预览区互相挤压。
- MUST 支持将当前渲染结果下载为普通 `.html` 文件，且不影响“复制到公众号”主链路。
- MUST 支持打开当前渲染结果的 PDF 打印视图，交由浏览器打印/另存为 PDF。
- MUST 支持将当前 Markdown 生成小红书卡片 PNG，卡片输出不得依赖远程图片加载。

## 场景
1. Given 用户在编辑器输入 Markdown, When 内容发生变化, Then 右侧预览在当前主题下更新。
2. Given 用户粘贴一张小于 10MB 的图片, When 图片保存成功, Then 编辑区插入一条 `![name](local-img://id)`。
3. Given 用户上传超过 2MB 的 Markdown 文件, When 触发上传, Then 当前内容不变并显示错误 toast。
4. Given 用户右键主题 chip, When 该主题支持收藏切换入口, Then 主题进入或移出收藏列表。
5. Given 用户打开主题管理, When 隐藏当前主题, Then 应自动切换到另一个可见主题。
6. Given 用户在移动视口打开编辑器, When 点击“预览”, Then 预览工具栏和文章预览可用。
7. Given 预览已渲染, When 用户点击 HTML 输出, Then 浏览器下载 `.html` 文件。
8. Given 预览已渲染, When 用户点击 PDF 输出, Then 浏览器打开包含文章内容的打印视图。
9. Given Markdown 不为空, When 用户点击卡片输出, Then 浏览器下载 `.png` 卡片文件。

## 可验证行为
- 运行 `npm run check`。
- 手动打开 `/`，验证上传、粘贴富文本、粘贴图片、主题搜索/筛选、隐藏/排序、复制、HTML 下载、PDF 打印视图、卡片下载、保存历史。
- 用浏览器移动视口验证编辑区和预览区无横向溢出。
