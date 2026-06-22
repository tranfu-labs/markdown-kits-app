export type ThemeStyles = {
  container: string;
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;
  p: string;
  strong: string;
  em: string;
  a: string;
  blockquote: string;
  code: string;
  pre: string;
  ul: string;
  ol: string;
  li: string;
  img: string;
  table: string;
  th: string;
  td: string;
  hr: string;
};

export type Theme = {
  id: string;
  name: string;
  category: string;
  accent: string;
  paper: string;
  ink: string;
  recommended?: boolean;
  styles: ThemeStyles;
};

export type HistoryArticle = {
  id: string;
  title: string;
  content: string;
  style: string;
  createdAt: number;
  updatedAt: number;
};

export type ShareRecord = {
  id: string;
  content: string;
  style: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
};

export type ShareListItem = Omit<ShareRecord, 'content'> & {
  title: string;
  contentBytes: number;
};
