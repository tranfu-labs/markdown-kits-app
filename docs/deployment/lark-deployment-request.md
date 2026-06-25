# Lark Deployment Request

## Status

- State: prepared, not sent
- Reason not sent: outbound IM requires explicit user approval for recipient, content, and sending identity
- Target chat: `Tranfu的AI员工养成记`
- Target chat ID: `oc_0c097efa8e1dd026ed84a61d7a22fe80`
- Sending identity: bot
- Repository: https://github.com/tranfu-labs/markdown-kits-app

## Message

```text
服务器运维机器人，请帮忙确认并部署项目：https://github.com/tranfu-labs/markdown-kits-app

项目资源：
React/Vite 前端 + Express 5 API + Node Web 服务
单容器，内部端口 8787
分享数据当前使用本地 JSON 文件，持久化路径 /app/data/shares.json
需要一个 Node Web 容器和一个持久化数据卷
后续如果多实例、大流量或多 MB 图片分享变多，再升级 SQLite/Postgres

环境变量有：
NODE_ENV=production
HOST=0.0.0.0
PORT=8787
LIST_PAGE_PASSWORD=<请在 Coolify 中设置生产密码>
SHARE_DATA_FILE=/app/data/shares.json
SHARE_MAX_CHARS=1500000
```

## Send Command

Run this only after explicit user approval:

```bash
lark-cli im +messages-send --as bot --chat-id oc_0c097efa8e1dd026ed84a61d7a22fe80 --text '<message above>'
```

