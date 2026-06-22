import { lazy, Suspense } from 'react';
import { EditorPage } from './pages/EditorPage';

const LazyAdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));
const LazySharePage = lazy(() => import('./pages/SharePage').then((module) => ({ default: module.SharePage })));

export function App() {
  const path = window.location.pathname;
  if (path.startsWith('/s/')) {
    return (
      <Suspense fallback={<div className="empty-state">正在加载内容...</div>}>
        <LazySharePage id={decodeURIComponent(path.split('/')[2] || '')} />
      </Suspense>
    );
  }
  if (path === '/list') {
    return (
      <Suspense fallback={<div className="empty-state">正在加载内容...</div>}>
        <LazyAdminPage />
      </Suspense>
    );
  }
  return <EditorPage />;
}
