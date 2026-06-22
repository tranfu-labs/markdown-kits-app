# 提案：phase6-output-expansion

## 背景
Phase 6 目标是在不扰乱公众号复制主链路的前提下扩展输出场景。当前用户已经有公众号复制和普通 HTML 下载，但还缺更适合移动浏览、社媒传播和 Agent 自动化的入口。

## 提案
- 增加主题搜索、分类筛选和主题 chip 缩略预览。
- 增加 PDF 打印视图、小红书卡片 PNG 输出。
- 增加 CLI/Agent Markdown 渲染入口，复用 `src/lib/render.ts`。

## 影响
- 影响 `editor`、`themes`、`rendering` 和 `visual-design` 域。
- 所有新增输出保持独立按钮或命令，不改变“复制到公众号”的默认行为。
