# visual-design 规格

## 域定位
`visual-design` 域负责 Markdown Kits 的应用壳视觉呈现。当前视觉经过 `tranfu-website-design` skill 重构，采用中性灰系统界面、红色强调、密度适中的工具型布局；不引入 TranFu 品牌 Logo 或官方文案。

## 业务规则
- MUST 让首屏直接进入可用编辑器，而不是营销落地页。
- MUST 使用克制的工具型界面：顶部栏、主题横栏、左右编辑/预览工作区、弹窗/侧栏。
- MUST 使用中性底色和细边框作为主视觉，红色 `#E63A46` 只用于品牌标记、主操作、active/focus 或关键强调。
- MUST 保持推荐小点为状态指示，不得扩大成大面积装饰。
- MUST 保持桌面和移动端无横向溢出。
- MUST 在移动端使用编辑/预览切换控制，当前状态必须清晰可见且按钮目标尺寸可点击。
- MUST 让按钮、主题 chip、工具栏和表格行有稳定尺寸，避免 hover 或文字变化造成布局跳动。
- MUST 遵守 `prefers-reduced-motion`，减少动效用户不应看到大幅动画。
- MUST NOT 添加装饰性渐变球、无关插画或营销 hero。
- MUST NOT 让应用壳 CSS 取代文章内联样式；公众号复制仍以 `src/styles/themes.ts` 和 `src/lib/render.ts` 为准。

## 场景
1. Given 桌面 1440px 视口, When 打开 `/`, Then 顶部、主题横栏、编辑器、预览区完整可见且无横向滚动。
2. Given 移动 390px 视口, When 打开 `/`, Then 工作区垂直排列或适配后无内容溢出。
3. Given 移动 390px 视口, When 用户在“编辑”和“预览”间切换, Then 只有当前工作区占据主要区域且页面无横向溢出。
4. Given 用户打开主题管理弹窗, When 查看列表, Then 行项目、按钮和标签不重叠。
5. Given 用户打开 `/list`, When 输入密码加载列表, Then 管理表格在移动端可横向滚动而页面整体不破版。

## 可验证行为
- 运行 `npm run check`。
- 用 Playwright 或浏览器检查桌面和移动视口，确认无 console error、无横向溢出、主要按钮目标尺寸可点击。
- 当前已保存的视觉截图位于 `/Users/hkd-xiaobei/.gstack/projects/markdown-kits/designs/tranfu-refactor-20260622/screenshots/`。
