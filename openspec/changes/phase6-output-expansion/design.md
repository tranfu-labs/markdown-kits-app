# 设计：phase6-output-expansion

## 方案
- 主题筛选使用 `Theme.category` 与 `themeCategories` 元数据；缩略预览只读取主题色和纸张色，不触发文章渲染。
- PDF 使用浏览器打印视图：复用 `prepareClipboardHtml()` 生成可打印 HTML，打开独立窗口后调用浏览器打印能力。
- 小红书卡片使用 Canvas 绘制标题、摘要、主题色和品牌信息，避免远程图片导致 Canvas 污染。
- CLI 入口通过 jsdom 安装 DOM 环境后动态导入 `renderMarkdown()`，输出完整 HTML 或 fragment。

## 权衡
- PDF 不在前端生成二进制 PDF，而是交给浏览器打印/另存为 PDF；这样不引入重量级 PDF 渲染依赖，也不影响 bundle。
- 卡片输出先做标题摘要卡片，不做完整长图；完整长图需要 DOM 截图或服务端渲染，风险更高。
- CLI 暂不处理 `local-img://` IndexedDB 图片；Agent/CI 场景优先覆盖纯 Markdown 与外链图片。

## 风险
- 浏览器可能阻止 PDF popup；UI 会 toast 提示失败。
- Canvas 字体在不同系统上略有差异；输出内容仍可读。
- CLI 依赖 jsdom 提供 DOM API；测试通过子进程覆盖基础渲染。
