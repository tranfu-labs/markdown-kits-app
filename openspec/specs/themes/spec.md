# themes 规格

## 域定位
`themes` 域负责公众号文章主题：主题元数据、分类、色彩、文章内联样式、主题列表顺序、主题搜索/筛选和推荐小点入口。主要实现位于 `src/styles/themes.ts`，推荐小点渲染由主题 chip 的 `theme.recommended` class 和 `src/styles.css` 的 `.theme-chip.recommended::after` 完成。

## 业务规则
- MUST 保持 `ThemeStyles` schema 完整覆盖 `container`、标题、段落、链接、代码、列表、图片、表格、分割线等关键 Markdown 元素。
- MUST 通过 `createTheme()` 从 palette 生成完整主题，避免手写不完整主题对象。
- MUST 让 `defaultThemeId` 指向 `themes[0].id`，当前默认主题为 `classic-ink`。
- MUST 让未知主题 ID 回退到默认主题。
- MUST 让文章复制所需样式以内联形式存在于 `theme.styles`，不能只依赖 `src/styles.css`。
- MUST 使用 `recommended: true` 控制主题 chip 的小点，不得把主题 ID 写死在 CSS。
- MUST 为每个主题提供 `category`，并通过 `themeCategories` 暴露分类筛选列表。
- MUST 在主题 chip 中展示小型缩略预览，缩略预览只能使用主题元数据，不得依赖文章渲染结果。
- MUST 保持当前推荐小点主题为：`财经纸页`、`陶土笔记`、`田野指南`、`线框杂志`、`银色实验室`、`琥珀快报`。
- MUST NOT 给 `经典墨线`、`红线简报`、`技术蓝图`、`深度阅读` 设置推荐小点，除非用户再次明确要求。
- MUST 在新增主题时补齐 `id`、`name`、`category`、`accent`、`paper`、`ink`、`muted`、`font`、`heading`。

## 场景
1. Given 用户选择一个主题, When 预览渲染, Then 文章容器和 Markdown 元素获得该主题内联样式。
2. Given 用户选择未知主题 ID, When 渲染, Then 回退 `classic-ink`。
3. Given 一个主题设置 `recommended: true`, When 主题 chip 渲染, Then chip 右上角出现状态小点。
4. Given 用户在主题管理里隐藏主题, When 返回主题横栏, Then 该主题从普通列表中移除；若已收藏或当前使用，则仍显示。
5. Given 用户搜索主题名或选择分类, When 主题横栏刷新, Then 只显示匹配主题。

## 可验证行为
- 运行 `npm run check`。
- 手动观察主题横栏，确认推荐小点只出现在规格列出的主题上。
- 手动搜索“技术”并筛选技术分类，确认 `技术蓝图` 可见。
- 用任意主题复制到剪贴板，确认 HTML 中包含内联 `style`。
