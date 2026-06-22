# local-content 规格

## 域定位
`local-content` 域负责浏览器本地内容：草稿、当前主题、文章历史、图片 IndexedDB、图片 Object URL 生命周期、中英文排版修复、主题收藏/隐藏/排序偏好、历史迁移与本地图片清理。主要实现位于 `src/lib/history.ts`、`src/lib/imageStore.ts`、`src/lib/autocorrect.ts`、`src/lib/localAssets.ts`、`src/hooks/useThemePrefs.ts`。

## 业务规则
- MUST 使用 `mk.markdownInput` 保存草稿内容。
- MUST 使用 `mk.currentStyle` 保存当前主题。
- MUST 使用 `mk.articleHistory` 保存历史文章数组，最多保留 20 篇。
- MUST 在 `localStorage` 读写失败时返回 fallback 或失败状态，不得让应用崩溃。
- MUST 从 Markdown 一级到六级标题提取历史标题；没有标题时从正文提取前 24 字并补省略号。
- MUST 使用 IndexedDB 数据库 `MarkdownKitsImages` 和 object store `images` 保存本地图片。
- MUST 在替换同 ID 图片或组件卸载时释放 Object URL。
- MUST 对非 GIF/SVG 图片使用 Canvas 压缩，最大宽高 1920，质量 0.85；压缩结果变大时保留原文件。
- MUST 在修复中英文空格时保护 Markdown 图片、链接、行内代码和围栏代码块，不得修改这些片段内部内容。
- MUST 支持将历史记录导出为 JSON，结构包含 `version`、`exportedAt` 与 `articles`。
- MUST 支持从 JSON 导入历史记录，并校验每条记录的 `id`、`title`、`content`、`style`、`createdAt`、`updatedAt`。
- MUST 支持将单篇历史记录下载为 `.md` 文件，文件名不得包含常见非法路径字符。
- MUST 支持清空历史记录，并在保存失败时展示错误 toast。
- MUST 展示本地图片数量和压缩后占用估算。
- MUST 清理孤儿图片前扫描当前草稿和历史中的 `local-img://<id>` 引用，只删除未被引用的 IndexedDB 图片。
- MUST 在图片统计或清理失败时展示错误 toast。

## 场景
1. Given 浏览器存储空间不足, When 保存草稿或历史, Then 函数返回 `false`，UI 显示错误 toast。
2. Given 一篇没有标题的 Markdown, When 保存历史, Then 历史标题从正文提取。
3. Given 同一个本地图片多次渲染, When 获取 Object URL, Then 复用缓存 URL。
4. Given 用户点击“修复空格”, When Markdown 包含 `[链接Text](url)`, Then 链接文本和 URL 不被改写。
5. Given 用户导出历史后清空历史, When 导入刚才的 JSON, Then 历史记录恢复。
6. Given 草稿或历史仍引用 `local-img://img-1`, When 清理孤儿图片, Then `img-1` 不会被删除。

## 可验证行为
- 运行 `npm run test -- tests/render.test.ts`、`npm run test:e2e` 或 `npm run check`。
- 手动验证刷新页面后草稿、主题、历史和本地图片可恢复。
