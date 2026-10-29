import { useCallback, useState } from 'react';

/**
 * 以 `ResizeObserver` 量測元素內容寬度（供時間軸計算每回寬）。
 * 回傳 callback ref 與目前寬度：掛載時以 `clientWidth` 取初值，之後隨尺寸變化更新；
 * 元素尚未掛載時寬度為 0；無 `ResizeObserver` 的環境只取初值。
 * （React 19 callback ref 可回傳清除函式，卸載時斷開觀察。）
 */
export function useElementWidth<T extends HTMLElement = HTMLElement>(): [
  (node: T | null) => (() => void) | undefined,
  number,
] {
  const [width, setWidth] = useState(0);

  const ref = useCallback((node: T | null) => {
    if (!node) return undefined;
    setWidth(node.clientWidth);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
