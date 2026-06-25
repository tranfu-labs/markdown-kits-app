# Markdown Kits App Deployment Execution Checklist

## Source And Scope

- Source document: `项目部署方案`
- Source URL: https://omq113gwol.sg.larksuite.com/wiki/X5ffwnhyVicMmAk3HuYlXk1Ngbf
- Fetched as: bot
- Source revision: `954`
- Local project path: `/Users/hkd-xiaobei/Documents/markdown-kits`

This document is the working checklist for taking the current local project to a TranFu/Coolify deployment. It records the decisions already made and the remaining work. Execute items in order unless a later discovery makes the order unsafe.

## Fixed Decisions

- Project name: `markdown-kits-app`
- GitHub organization: `tranfu-labs`
- Target repository: `https://github.com/tranfu-labs/markdown-kits-app`
- Repository visibility: public
- Deployment target: Coolify / Traefik reverse proxy
- Application shape: React/Vite frontend plus Express API
- Runtime service: Node web container
- Default internal app port: `8787`, unless server operations requires another port
- Production host binding: `0.0.0.0`
- Commit email requirement: `253661133+BruceL017@users.noreply.github.com`

## Current Local State

- Current package name has been updated to `markdown-kits-app`.
- Current git remote is `https://github.com/tranfu-labs/markdown-kits-app.git`.
- Current remote meets the company organization requirement.
- Current repository name ends with `-app`.
- `Dockerfile` exists.
- `.dockerignore` exists.
- `compose.yml` exists.
- `.github/workflows/check.yml` exists.
- `.env.example` exists.
- Production server requires `LIST_PAGE_PASSWORD`.
- Share data defaults to `data/shares.json`, or `SHARE_DATA_FILE` when configured.
- `data/shares.json` is ignored by git and should not be committed.
- Production start uses `node dist-server/server/index.js`.
- Dedicated health endpoint exists at `GET /api/health`.
- `coolify-deploy` skill is installed locally.

## Done Definition

- Public GitHub repository exists at `tranfu-labs/markdown-kits-app`.
- Local `origin` points to the company repository.
- Deployment packaging files are present and reviewed: `.dockerignore`, `Dockerfile`, `compose.yml`.
- Production environment variables are documented without real secrets.
- CI runs at least `npm ci` and `npm run check`.
- Local checks pass before deployment.
- Coolify deployment is started from the company repository.
- The Lark Wiki deployment table is updated while deployment is in progress and after completion.
- Production URL opens and core flows work.
- Docker CLI is installed locally, but the Docker daemon was not running during local verification, so image build verification remains pending.

## Execution Checklist

### 1. Repository Preparation

- [x] Rename project metadata from `markdown-kits` to `markdown-kits-app` where appropriate.
  - Verify: `package.json` has the expected project name and the app still builds.
- [x] Create a public repository under the company organization: `tranfu-labs/markdown-kits-app`.
  - Verify: repository URL is `https://github.com/tranfu-labs/markdown-kits-app`.
- [x] Update local git remote from the personal repository to the company repository.
  - Verify: `git remote -v` shows only `https://github.com/tranfu-labs/markdown-kits-app.git` for `origin`.
- [x] Confirm git author email before any commit.
  - Verify: `git config user.email` prints `253661133+BruceL017@users.noreply.github.com`.
- [x] Push the intended deployment branch to the company repository.
  - Verify: GitHub repository contains the current project files and branch.

### 2. Server Resource Check

- [ ] Ask the server operations bot in the TRANFU group about this project's required resources.
  - Suggested message:

```text
当前项目 markdown-kits-app 打算部署到 Coolify。技术栈是 React/Vite 前端 + Express 5 API + Node Web 服务，当前分享数据使用本地 JSON 文件 data/shares.json，可通过 SHARE_DATA_FILE 指定持久化路径；后续可能升级 SQLite。当前服务器是否可以满足一个 Node Web 容器和一个持久化数据卷的要求？如果不满足，是否有适合 MVP 场景的临时方案？临时方案的缺点在哪里，遇到什么项目运营场景时就需要优化方案？
```

  - Verify: server operations reply confirms resources, port/domain constraints, and whether JSON storage is acceptable for MVP.

### 3. Storage Decision

- [x] Decide whether this release keeps JSON file storage or migrates to SQLite first.
  - Verify: JSON storage is kept for this single-instance release per `docs/adr/0003-share-json-governance-and-growth-path.md`.
- [x] If keeping JSON storage, configure persistent storage for the share data file.
  - Verify: `SHARE_DATA_FILE` points to a mounted persistent path such as `/app/data/shares.json`.
- [ ] If migrating to SQLite first, create a separate implementation plan before deployment packaging.
  - Verify: migration plan covers schema, data migration, tests, and rollback.

### 4. Environment Documentation

- [x] Add a production environment example without real secrets.
  - Required variables:
    - `NODE_ENV=production`
    - `HOST=0.0.0.0`
    - `PORT=8787`
    - `LIST_PAGE_PASSWORD=<set-in-coolify>`
    - `SHARE_DATA_FILE=/app/data/shares.json`
    - `SHARE_MAX_CHARS=1500000`
  - Verify: no real passwords, tokens, keys, or user content are committed.
- [x] Document local and production startup commands.
  - Verify: README or deployment doc explains the difference between `npm run dev`, `npm run build`, and production start.

### 5. Production Runtime Path

- [x] Decide how the server runs in the production image.
  - Option A: keep `tsx` in runtime and start `tsx server/index.ts`.
  - Option B: add a server build step and start with `node`.
  - Preferred direction: use a production `node` start path if it can be done without overcomplicating the project.
- [x] Update scripts only as needed for the chosen runtime.
  - Verify: production command starts the Express server and serves `dist/`.

### 6. Coolify Packaging

- [x] Use `coolify-deploy` to prepare Docker/Coolify files.
  - Verify: generated files match the project build and runtime path.
- [x] Create `.dockerignore`.
  - Verify: it excludes at least `node_modules`, `.git`, `dist`, `.env`, `.env.*`, `test-results`, `playwright-report`, and local data that should not be baked into the image.
- [x] Create `Dockerfile`.
  - Verify: it is multi-stage, builds with `npm ci` and `npm run build`, and exposes the same internal port the app listens on.
- [x] Create `compose.yml`.
  - Verify: web service uses `expose`, not host `ports`.
- [x] Configure a persistent volume for share data.
  - Verify: volume has an explicit `name:` and maps to the path used by `SHARE_DATA_FILE`.
- [x] Ensure app port consistency.
  - Verify: `PORT`, Dockerfile `EXPOSE`, compose `expose`, and the Express listen port all align.
- [x] Add a healthcheck that clears proxy variables before checking localhost.
  - Verify: healthcheck command starts with `HTTP_PROXY= HTTPS_PROXY= http_proxy= https_proxy=`.

### 7. Health Endpoint

- [x] Add a minimal health endpoint if needed for stable Coolify healthchecks.
  - Suggested endpoint: `GET /api/health`.
  - Verify: endpoint returns 200 without requiring authentication.
- [x] Add a focused server test for the health endpoint if it is implemented.
  - Verify: `npm run test -- tests/server.test.ts` passes.

### 8. CI

- [x] Add GitHub Actions workflow.
  - Minimum steps:
    - `npm ci`
    - `npm run check`
  - Optional deployment gate:
    - `npm run test:e2e`
  - Verify: workflow passes on the company repository.
- [x] Confirm no secrets are committed or printed in CI logs.
  - Verify: repository contains no `.env` files or real production credentials.

### 9. Local Verification Before Deployment

- [x] Run full project check.
  - Verify: `npm run check` passes.
- [x] Run browser E2E if deployment-facing UI changed.
  - Verify: `npm run test:e2e` passes.
- [x] Run production start locally if packaging changed.
  - Verify: app serves the built frontend and API under `NODE_ENV=production`.
- [x] Confirm the working tree contains only intended changes.
  - Verify: `git status --short` is reviewed before commit.

### 10. Deployment Request

- [ ] Prepare message for the TRANFU server operations bot.
  - Template:

```text
部署项目：https://github.com/tranfu-labs/markdown-kits-app

环境变量有：
NODE_ENV=production
HOST=0.0.0.0
PORT=8787
LIST_PAGE_PASSWORD=<请在 Coolify 中设置生产密码>
SHARE_DATA_FILE=/app/data/shares.json
SHARE_MAX_CHARS=1500000
```

  - Verify: the message contains no real password or secret values.
- [ ] Send deployment request in the TRANFU group.
  - Verify: operations bot acknowledges the deployment.

### 11. Lark Wiki Tracking

- [ ] Add `markdown-kits-app` to the Wiki deployment table when deployment starts.
  - Status: `🚀 上线中`
  - GitHub link: `https://github.com/tranfu-labs/markdown-kits-app`
  - Verify: table row is visible in the source Wiki.
- [ ] If deployment fails, update status to `🐞 遇到 BUG` and add the blocker in the relevant task notes.
  - Verify: blocker is specific enough to reproduce or escalate.
- [ ] After deployment passes verification, update status to `✅ 已上线` and add the production URL.
  - Verify: Wiki row contains GitHub URL and production URL.

### 12. Production Verification

- [ ] Open the production homepage.
  - Verify: page loads without a 502, blank screen, or asset 404s.
- [ ] Create a share.
  - Verify: API returns a share ID and share page opens.
- [ ] Open a share URL directly.
  - Verify: rendered article content appears.
- [ ] Log into `/list` with the production list password.
  - Verify: share management page loads.
- [ ] Restart or redeploy the container.
  - Verify: previous share data remains available from the persistent data file.
- [ ] Confirm the public URL uses the expected domain.
  - Expected pattern: `https://markdown-kits-app.tranfu.com/`, unless operations assigns another domain.

## Risks And Notes

- JSON file storage is single-instance only. If Coolify runs multiple app replicas, replace `ShareStore` with SQLite or another shared storage before deployment.
- `LIST_PAGE_PASSWORD` is required in production. Do not use the development password.
- Do not commit `data/shares.json`, `.env`, screenshots, local reports, or build output.
- Do not use real API keys in examples or Lark messages.
- If a GitHub commit is created, verify author email with `git log -1 --format='%ae'`.
