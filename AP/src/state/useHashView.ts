/**
 * 網址 hash ↔ 視圖同步（plan「路由（hash）」；FR-005、AC-S17）。
 * 只記視圖（#timeline／#map／#graph），篩選不寫入網址；寫回用 `history.replaceState`，不產生歷史紀錄。
 */
import { useEffect, useRef } from 'react';
import type { View } from './appReducer';

const VIEWS: readonly View[] = ['timeline', 'map', 'graph'];

function isView(value: string): value is View {
  return (VIEWS as readonly string[]).includes(value);
}

/** 解析 hash：`#timeline`／`#map`／`#graph` 以外（含空、大小寫不同）一律 `timeline`。 */
export function readHashView(hash: string = window.location.hash): View {
  const key = hash.startsWith('#') ? hash.slice(1) : hash;
  return isView(key) ? key : 'timeline';
}

/** 以 `replaceState` 把 `#<view>` 寫回網址（保留 path 與 query）；已相同則不動。 */
export function writeHashView(view: View): void {
  const { pathname, search, hash } = window.location;
  if (hash === `#${view}`) return;
  window.history.replaceState(window.history.state, '', `${pathname}${search}#${view}`);
}

/**
 * view 變動（含初次掛載）時寫回 hash；監聽 `hashchange` 時以解析結果呼叫 `onChange`。
 * `onChange` 換參照不會重新訂閱或重寫網址（以 ref 取最新值）。
 */
export function useHashSync(view: View, onChange: (view: View) => void): void {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    writeHashView(view);
  }, [view]);

  useEffect(() => {
    const handle = () => onChangeRef.current(readHashView());
    window.addEventListener('hashchange', handle);
    return () => window.removeEventListener('hashchange', handle);
  }, []);
}
