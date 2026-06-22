import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { defaultThemeId, themes } from '../styles/themes';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useThemePrefs(themeId: string, setThemeId: Dispatch<SetStateAction<string>>) {
  const [starred, setStarred] = useState<string[]>(() => readJson('mk.starredStyles', []));
  const [hidden, setHidden] = useState<string[]>(() => readJson('mk.hiddenStyles', []));
  const [styleOrder, setStyleOrder] = useState<string[]>(
    () => readJson('mk.styleOrder', themes.map((theme) => theme.id))
  );

  const visibleThemeIds = useMemo(() => {
    const ordered = [...styleOrder.filter((id) => themes.some((theme) => theme.id === id))];
    themes.forEach((theme) => {
      if (!ordered.includes(theme.id)) ordered.push(theme.id);
    });
    return ordered.filter((id) => !hidden.includes(id) || starred.includes(id) || id === themeId);
  }, [hidden, starred, styleOrder, themeId]);

  useEffect(() => {
    localStorage.setItem('mk.starredStyles', JSON.stringify(starred));
  }, [starred]);

  useEffect(() => {
    localStorage.setItem('mk.hiddenStyles', JSON.stringify(hidden));
  }, [hidden]);

  useEffect(() => {
    localStorage.setItem('mk.styleOrder', JSON.stringify(styleOrder));
  }, [styleOrder]);

  function toggleHidden(id: string) {
    setHidden((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (id === themeId) setThemeId(visibleThemeIds.find((item) => item !== id) || defaultThemeId);
      return [...current, id];
    });
  }

  function moveStyle(id: string, direction: -1 | 1) {
    setStyleOrder((current) => {
      const next = [...current];
      const index = next.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function resetThemePrefs() {
    setHidden([]);
    setStyleOrder(themes.map((theme) => theme.id));
  }

  return {
    hidden,
    moveStyle,
    resetThemePrefs,
    setStarred,
    starred,
    styleOrder,
    toggleHidden,
    visibleThemeIds
  };
}
