import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

export type Share = {
  id: string;
  content: string;
  style: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
};

type ShareListItem = Omit<Share, 'content'> & {
  title: string;
  contentBytes: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.resolve(rootDir, 'data');
const defaultDataFile = path.resolve(dataDir, 'shares.json');

type PasswordResolution = {
  password: string;
  usingDefault: boolean;
};

type ShareServerOptions = {
  dataFile?: string;
  listPassword?: string;
  maxContentChars?: number;
  serveStatic?: boolean;
};

export function resolveListPassword(env: NodeJS.ProcessEnv = process.env): PasswordResolution {
  const configured = env.LIST_PAGE_PASSWORD?.trim();
  if (configured) return { password: configured, usingDefault: false };
  if (env.NODE_ENV === 'production') {
    throw new Error('LIST_PAGE_PASSWORD must be set in production');
  }
  return { password: 'dev-password', usingDefault: true };
}

export function resolveHost(env: NodeJS.ProcessEnv = process.env) {
  return env.HOST || (env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
}

export class ShareStore {
  private queue = Promise.resolve();

  constructor(private readonly filePath = defaultDataFile) {}

  async read(): Promise<Share[]> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as { shares?: Share[] };
      return Array.isArray(parsed.shares) ? parsed.shares : [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  async write(shares: Share[]) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const tempFile = `${this.filePath}.${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify({ shares }, null, 2));
    await fs.rename(tempFile, this.filePath);
  }

  async mutate<T>(operation: (shares: Share[]) => Promise<{ shares: Share[]; result: T }>) {
    const run = this.queue.then(async () => {
      const current = await this.read();
      const { shares, result } = await operation(current);
      await this.write(shares);
      return result;
    });
    this.queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }
}

function createId() {
  return crypto.randomBytes(5).toString('base64url').slice(0, 8);
}

function stripCitationMarkers(content: string) {
  return content.replace(/\uE200cite\uE202[^\uE201]*\uE201/g, '');
}

function contentBytes(content: string) {
  return Buffer.byteLength(content, 'utf8');
}

function isExpired(share: Share, now = Date.now()) {
  return Boolean(share.expiresAt && Date.parse(share.expiresAt) <= now);
}

export function extractTitle(content: string) {
  const clean = stripCitationMarkers(content);
  const heading = clean.match(/^#{1,6}\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading.replace(/[*_`~]/g, '').slice(0, 80);

  const firstLine = clean
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !/^(!?\[|[-*>|`#])/.test(line));

  if (!firstLine) return '无标题';
  return firstLine
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .slice(0, 40);
}

export function createShareApp(options: ShareServerOptions = {}) {
  const app = express();
  const store = new ShareStore(options.dataFile);
  const listPassword = options.listPassword ?? resolveListPassword().password;
  const maxContentChars = options.maxContentChars ?? Number(process.env.SHARE_MAX_CHARS || 1_500_000);
  const rateBuckets = new Map<string, { count: number; resetAt: number }>();

  app.use(express.json({ limit: '8mb' }));

  function authorized(req: express.Request) {
    return req.header('X-List-Password')?.trim() === listPassword;
  }

  function checkRateLimit(ip: string) {
    const now = Date.now();
    const bucket = rateBuckets.get(ip);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    bucket.count += 1;
    return bucket.count <= 30;
  }

  app.post('/api/share', async (req, res, next) => {
    try {
      if (!checkRateLimit(req.ip || 'unknown')) {
        res.status(429).json({ error: '请求过于频繁，请稍后再试' });
        return;
      }

      const content = String(req.body?.content || '');
      const style = String(req.body?.style || 'classic-ink');
      const rawExpiresAt = typeof req.body?.expiresAt === 'string' ? req.body.expiresAt.trim() : '';
      const expiresAt = rawExpiresAt || null;

      if (!content.trim()) {
        res.status(400).json({ error: '内容不能为空' });
        return;
      }
      if (content.length > maxContentChars) {
        res.status(413).json({ error: '分享内容过大，请压缩图片或减少内容' });
        return;
      }
      if (expiresAt && Number.isNaN(Date.parse(expiresAt))) {
        res.status(400).json({ error: '过期时间格式不正确' });
        return;
      }

      const share = await store.mutate(async (shares) => {
        let id = createId();
        while (shares.some((item) => item.id === id)) id = createId();

        const now = new Date().toISOString();
        const nextShare: Share = { id, content, style, createdAt: now, updatedAt: now, expiresAt };
        return { shares: [nextShare, ...shares], result: nextShare };
      });
      res.status(201).json(share);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/share/:id', async (req, res, next) => {
    try {
      const shares = await store.read();
      const share = shares.find((item) => item.id === req.params.id);
      if (!share || isExpired(share)) {
        res.status(404).json({ error: '分享不存在' });
        return;
      }
      res.json(share);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/shares', async (req, res, next) => {
    try {
      if (!authorized(req)) {
        res.status(401).json({ error: '密码错误或缺失' });
        return;
      }

      const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String).filter(Boolean) : [];
      if (ids.length === 0) {
        res.status(400).json({ error: '缺少要删除的分享' });
        return;
      }

      const idSet = new Set(ids);
      const result = await store.mutate(async (shares) => {
        const nextShares = shares.filter((item) => !idSet.has(item.id));
        return { shares: nextShares, result: { deleted: shares.length - nextShares.length } };
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/share/:id', async (req, res, next) => {
    try {
      if (!authorized(req)) {
        res.status(401).json({ error: '密码错误或缺失' });
        return;
      }

      const result = await store.mutate(async (shares) => {
        const nextShares = shares.filter((item) => item.id !== req.params.id);
        if (nextShares.length === shares.length) {
          return { shares, result: null };
        }
        return { shares: nextShares, result: { id: req.params.id, message: '删除成功' } };
      });

      if (!result) {
        res.status(404).json({ error: '分享不存在' });
        return;
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/shares', async (req, res, next) => {
    try {
      if (!authorized(req)) {
        res.status(401).json({ error: '密码错误或缺失' });
        return;
      }

      const page = Math.max(1, Number(req.query.page || 1) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20) || 20));
      const search = String(req.query.search || '').trim().toLowerCase();
      const sort = String(req.query.sort || 'createdAt_desc');
      const shares = await store.read();
      const items: ShareListItem[] = shares.map((share) => ({
        id: share.id,
        title: extractTitle(share.content),
        style: share.style,
        createdAt: share.createdAt,
        updatedAt: share.updatedAt,
        expiresAt: share.expiresAt || null,
        contentBytes: contentBytes(share.content)
      }));
      const filtered = search
        ? items.filter((item) =>
            [item.id, item.title, item.style].some((value) => value.toLowerCase().includes(search))
          )
        : items;

      filtered.sort((a, b) => {
        if (sort === 'createdAt_asc') return a.createdAt.localeCompare(b.createdAt);
        if (sort === 'updatedAt_desc') return b.updatedAt.localeCompare(a.updatedAt);
        if (sort === 'updatedAt_asc') return a.updatedAt.localeCompare(b.updatedAt);
        if (sort === 'title_asc') return a.title.localeCompare(b.title, 'zh-CN');
        if (sort === 'title_desc') return b.title.localeCompare(a.title, 'zh-CN');
        return b.createdAt.localeCompare(a.createdAt);
      });

      const start = (page - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);
      const totalBytes = shares.reduce((sum, share) => sum + contentBytes(share.content), 0);

      res.json({
        items: paged,
        count: paged.length,
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
        stats: {
          records: shares.length,
          contentBytes: totalBytes,
          jsonBytes: contentBytes(JSON.stringify({ shares }))
        }
      });
    } catch (error) {
      next(error);
    }
  });

  if (options.serveStatic) {
    const distDir = path.resolve(rootDir, 'dist');
    app.use(express.static(distDir));
    app.get('*splat', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  return app;
}

export function startServer() {
  const apiPort = Number(process.env.PORT || process.env.API_PORT || 8787);
  const host = resolveHost();
  const password = resolveListPassword();
  const app = createShareApp({
    dataFile: process.env.SHARE_DATA_FILE ? path.resolve(process.env.SHARE_DATA_FILE) : defaultDataFile,
    listPassword: password.password,
    serveStatic: process.env.NODE_ENV === 'production'
  });

  app.listen(apiPort, host, () => {
    console.log(`Share API listening at http://${host}:${apiPort}`);
    if (password.usingDefault) {
      console.log('LIST_PAGE_PASSWORD not set; using development password: dev-password');
    }
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
