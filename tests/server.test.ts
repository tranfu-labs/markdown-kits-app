import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vitest';
import { createShareApp, resolveHost, resolveListPassword } from '../server/index';

type TestServer = {
  baseUrl: string;
  close: () => Promise<void>;
  dir: string;
};

const servers: TestServer[] = [];

async function createTestServer() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'markdown-kits-'));
  const app = createShareApp({
    dataFile: path.join(dir, 'shares.json'),
    listPassword: 'secret',
    maxContentChars: 1_500_000
  });
  const server: Server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  const testServer: TestServer = {
    baseUrl: `http://127.0.0.1:${port}`,
    dir,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
  servers.push(testServer);
  return testServer;
}

async function createShare(server: TestServer, content: string, extra: Record<string, unknown> = {}) {
  const response = await fetch(`${server.baseUrl}/api/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, style: 'classic-ink', ...extra })
  });
  return { response, data: await response.json() as { id: string; error?: string } };
}

afterEach(async () => {
  while (servers.length) {
    const server = servers.pop()!;
    await server.close();
    await rm(server.dir, { recursive: true, force: true });
  }
});

describe('share API', () => {
  it('requires an explicit list password in production', () => {
    expect(() => resolveListPassword({ NODE_ENV: 'production' })).toThrow(/LIST_PAGE_PASSWORD/);
    expect(resolveListPassword({ NODE_ENV: 'development' }).password).toBe('dev-password');
    expect(resolveHost({ NODE_ENV: 'production' })).toBe('0.0.0.0');
    expect(resolveHost({ NODE_ENV: 'development' })).toBe('127.0.0.1');
  });

  it('does not lose shares during concurrent creates', async () => {
    const server = await createTestServer();
    const tag = `race-${Date.now()}`;
    const responses = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        fetch(`${server.baseUrl}/api/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `# ${tag}-${index}\n\nbody`, style: 'classic-ink' })
        })
      )
    );

    expect(responses.map((response) => response.status)).toEqual(Array(20).fill(201));
    const listResponse = await fetch(`${server.baseUrl}/api/shares`, {
      headers: { 'X-List-Password': 'secret' }
    });
    const list = (await listResponse.json()) as { items: Array<{ title: string }> };
    expect(list.items.filter((item) => item.title.startsWith(tag))).toHaveLength(20);
  });

  it('expires shares with past TTL and rejects invalid expiry dates', async () => {
    const server = await createTestServer();
    const expired = await createShare(server, '# Expired\n\nbody', {
      expiresAt: new Date(Date.now() - 1_000).toISOString()
    });
    expect(expired.response.status).toBe(201);

    const readExpired = await fetch(`${server.baseUrl}/api/share/${expired.data.id}`);
    expect(readExpired.status).toBe(404);

    const invalid = await createShare(server, '# Invalid\n\nbody', { expiresAt: 'not-a-date' });
    expect(invalid.response.status).toBe(400);
  });

  it('lists shares with pagination, search, sorting, and storage stats', async () => {
    const server = await createTestServer();
    await createShare(server, '# Alpha B\n\nbody');
    await createShare(server, '# Beta\n\nbody');
    await createShare(server, '# Alpha A\n\nbody');

    const response = await fetch(`${server.baseUrl}/api/shares?page=1&pageSize=1&search=Alpha&sort=title_asc`, {
      headers: { 'X-List-Password': 'secret' }
    });
    const data = (await response.json()) as {
      items: Array<{ title: string; contentBytes: number }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      stats: { records: number; contentBytes: number; jsonBytes: number };
    };

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].title).toBe('Alpha A');
    expect(data.items[0].contentBytes).toBeGreaterThan(0);
    expect(data.total).toBe(2);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(1);
    expect(data.totalPages).toBe(2);
    expect(data.stats.records).toBe(3);
    expect(data.stats.contentBytes).toBeGreaterThan(0);
    expect(data.stats.jsonBytes).toBeGreaterThan(data.stats.contentBytes);
  });

  it('deletes selected shares in a batch', async () => {
    const server = await createTestServer();
    const first = await createShare(server, '# Batch one\n\nbody');
    const second = await createShare(server, '# Batch two\n\nbody');

    const response = await fetch(`${server.baseUrl}/api/shares`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-List-Password': 'secret' },
      body: JSON.stringify({ ids: [first.data.id, second.data.id] })
    });
    const data = (await response.json()) as { deleted: number };
    expect(response.status).toBe(200);
    expect(data.deleted).toBe(2);

    const listResponse = await fetch(`${server.baseUrl}/api/shares`, {
      headers: { 'X-List-Password': 'secret' }
    });
    const list = (await listResponse.json()) as { items: Array<{ id: string }> };
    expect(list.items.some((item) => item.id === first.data.id || item.id === second.data.id)).toBe(false);
  });
});
