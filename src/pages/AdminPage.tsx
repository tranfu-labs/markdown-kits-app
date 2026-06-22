import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../lib/date';
import { formatSize } from '../lib/imageStore';
import { getTheme } from '../lib/render';
import type { ShareListItem } from '../types';

type ShareListResponse = {
  items: ShareListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    records: number;
    contentBytes: number;
    jsonBytes: number;
  };
  error?: string;
};

function formatExpiresAt(value?: string | null) {
  if (!value) return '永久';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

export function AdminPage() {
  const [password, setPassword] = useState(sessionStorage.getItem('mk.listPassword') || '');
  const [items, setItems] = useState<ShareListItem[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('createdAt_desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<ShareListResponse['stats'] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const { toast, showToast } = useToast();

  async function loadList(nextPassword = password, nextPage = page, nextSearch = search, nextSort = sort) {
    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: String(pageSize),
      search: nextSearch,
      sort: nextSort
    });
    const response = await fetch(`/api/shares?${params}`, { headers: { 'X-List-Password': nextPassword } });
    const data = (await response.json()) as ShareListResponse;
    if (!response.ok) {
      showToast(data.error || '加载失败', 'error');
      return;
    }
    sessionStorage.setItem('mk.listPassword', nextPassword);
    setItems(data.items || []);
    setTotal(data.total || 0);
    setPage(data.page || nextPage);
    setTotalPages(data.totalPages || 1);
    setStats(data.stats || null);
    setSelected([]);
  }

  function toggleSelected(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function deleteShare(id: string) {
    const response = await fetch(`/api/share/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'X-List-Password': password }
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error || '删除失败', 'error');
      return;
    }
    showToast('已删除');
    await loadList();
  }

  async function deleteSelected() {
    if (selected.length === 0) {
      showToast('请选择要删除的分享', 'error');
      return;
    }
    if (!window.confirm(`确认删除 ${selected.length} 条分享？`)) return;
    const response = await fetch('/api/shares', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-List-Password': password },
      body: JSON.stringify({ ids: selected })
    });
    const data = (await response.json()) as { deleted?: number; error?: string };
    if (!response.ok) {
      showToast(data.error || '批量删除失败', 'error');
      return;
    }
    showToast(`已删除 ${data.deleted || 0} 条`);
    await loadList(password, page);
  }

  useEffect(() => {
    if (password) loadList(password);
  }, []);

  return (
    <div className="admin-page">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">M</span>
          <span>分享管理</span>
        </a>
      </header>
      <main className="admin-panel">
        <div className="admin-auth">
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="列表密码" />
          <button className="copy-button" onClick={() => loadList(password, 1)}>
            加载列表
          </button>
        </div>
        <div className="admin-controls">
          <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="搜索 ID 或标题" />
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              loadList(password, 1, search, event.target.value);
            }}
          >
            <option value="createdAt_desc">创建时间 ↓</option>
            <option value="createdAt_asc">创建时间 ↑</option>
            <option value="updatedAt_desc">更新时间 ↓</option>
            <option value="updatedAt_asc">更新时间 ↑</option>
            <option value="title_asc">标题 A-Z</option>
            <option value="title_desc">标题 Z-A</option>
          </select>
          <button className="tool-button" onClick={() => loadList(password, 1)}>
            搜索
          </button>
          <button className="tool-button danger-inline" onClick={deleteSelected}>
            批量删除
          </button>
        </div>
        <div className="admin-metrics">
          <span>当前 {total} 条</span>
          <span>总记录 {stats?.records ?? 0} 条</span>
          <span>内容 {formatSize(stats?.contentBytes ?? 0)}</span>
          <span>JSON {formatSize(stats?.jsonBytes ?? 0)}</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="选择当前页分享"
                    checked={items.length > 0 && selected.length === items.length}
                    onChange={(event) => setSelected(event.target.checked ? items.map((item) => item.id) : [])}
                  />
                </th>
                <th>ID</th>
                <th>标题</th>
                <th>样式</th>
                <th>大小</th>
                <th>过期</th>
                <th>创建</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`选择分享 ${item.id}`}
                      checked={selected.includes(item.id)}
                      onChange={() => toggleSelected(item.id)}
                    />
                  </td>
                  <td>
                    <a href={`/s/${item.id}`}>{item.id}</a>
                  </td>
                  <td>{item.title}</td>
                  <td>{getTheme(item.style).name}</td>
                  <td>{formatSize(item.contentBytes)}</td>
                  <td>{formatExpiresAt(item.expiresAt)}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <button className="icon-button danger" onClick={() => deleteShare(item.id)} aria-label={`删除分享 ${item.id}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <button className="tool-button" disabled={page <= 1} onClick={() => loadList(password, page - 1)}>
            上一页
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button className="tool-button" disabled={page >= totalPages} onClick={() => loadList(password, page + 1)}>
            下一页
          </button>
        </div>
      </main>
      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}
    </div>
  );
}
