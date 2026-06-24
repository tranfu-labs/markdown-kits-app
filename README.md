# Markdown Kits

## 中文

Markdown Kits 是一个面向微信公众号发布的 Markdown 排版工具。它支持实时预览、主题样式内联、本地图片处理、复制到公众号、短链分享和分享管理。

### 功能

- Markdown 编辑与公众号风格预览
- 主题搜索、分类和缩略预览
- 本地图片粘贴、压缩和历史记录
- 复制 HTML 到公众号后台
- 分享短链与管理列表
- HTML、PDF 打印视图和卡片导出

### 本地运行

```bash
npm install
npm run dev
```

默认地址：

- Web: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8787`
- 开发环境列表密码: `dev-password`

### 检查

```bash
npm run check
npm run test:e2e
```

### 生产环境变量

- `LIST_PAGE_PASSWORD`: 分享管理页密码，生产环境必填
- `SHARE_DATA_FILE`: 分享数据文件路径，可选
- `SHARE_MAX_CHARS`: 单条分享内容字符上限，可选

## English

Markdown Kits is a Markdown layout editor for WeChat Official Account publishing. It provides live preview, inline article themes, local image handling, WeChat-ready HTML copy, share links, and share management.

### Features

- Markdown editing with WeChat-style preview
- Theme search, categories, and mini previews
- Local image paste, compression, and history
- Copy HTML for WeChat publishing
- Share links and admin list
- HTML, PDF print view, and card export

### Local Development

```bash
npm install
npm run dev
```

Default URLs:

- Web: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8787`
- Development list password: `dev-password`

### Checks

```bash
npm run check
npm run test:e2e
```

### Production Environment

- `LIST_PAGE_PASSWORD`: required password for the share admin page
- `SHARE_DATA_FILE`: optional share data file path
- `SHARE_MAX_CHARS`: optional max characters per share
