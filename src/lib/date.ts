export function formatDate(value: number | string) {
  const date = new Date(value);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return date.toLocaleString('zh-CN', { hour12: false });
}
