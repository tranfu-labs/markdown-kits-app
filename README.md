# Markdown Kits App

## 中文

Markdown Kits App 是一个面向微信公众号发布的 Markdown 排版工具。它支持实时预览、主题样式内联、本地图片处理、复制到公众号、短链分享和分享管理。

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

### 生产运行

```bash
npm run build
npm run start
```

### 生产环境变量

- `NODE_ENV`: 生产环境设置为 `production`
- `HOST`: 生产环境设置为 `0.0.0.0`
- `PORT`: 服务监听端口，默认 `8787`
- `LIST_PAGE_PASSWORD`: 分享管理页密码，生产环境必填；Coolify compose 部署时由 `SERVICE_PASSWORD_LIST_PAGE` 注入
- `SERVICE_PASSWORD_LIST_PAGE`: Coolify magic variable，推荐让 Coolify 自动生成，手动本地测试可用 `openssl rand -hex 32`
- `SHARE_DATA_FILE`: 分享数据文件路径，可选，Coolify 部署建议 `/app/data/shares.json`
- `SHARE_MAX_CHARS`: 单条分享内容字符上限，可选，默认 `1500000`

## English

Markdown Kits App is a Markdown layout editor for WeChat Official Account publishing. It provides live preview, inline article themes, local image handling, WeChat-ready HTML copy, share links, and share management.

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

### Production

```bash
npm run build
npm run start
```

### Production Environment

- `NODE_ENV`: set to `production`
- `HOST`: set to `0.0.0.0`
- `PORT`: service port, defaults to `8787`
- `LIST_PAGE_PASSWORD`: required password for the share admin page; compose injects it from `SERVICE_PASSWORD_LIST_PAGE` on Coolify
- `SERVICE_PASSWORD_LIST_PAGE`: Coolify magic variable; let Coolify generate it, or use `openssl rand -hex 32` for local compose testing
- `SHARE_DATA_FILE`: optional share data file path, `/app/data/shares.json` is recommended for Coolify
- `SHARE_MAX_CHARS`: optional max characters per share, defaults to `1500000`
