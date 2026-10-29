import { useSyncExternalStore } from 'react';

/** 窄螢幕斷點（對應 tokens 的 `--bp-sheet: 720px`；CSS media query 不能用 var，JS 端以數值同步）。 */
export const BP_SHEET = 720;
/** 地圖側欄堆疊斷點（對應 `--bp-map-stack: 900px`）。 */
export const BP_MAP_STACK = 900;

/** `(max-width: 720px)`：面板改底部抽屜、時間軸改直向列表、chip 橫捲。 */
export const NARROW_QUERY = `(max-width: ${BP_SHEET}px)`;

function getMediaQueryList(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  return window.matchMedia(query);
}

/**
 * 訂閱 CSS media query 是否成立。
 * 無 `matchMedia` 的環境（SSR）回傳 false。
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = getMediaQueryList(query);
      if (!mql) return () => {};
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
      }
      // 舊版 Safari 僅支援 addListener
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    },
    () => getMediaQueryList(query)?.matches ?? false,
    () => false,
  );
}

/** 視窗寬度 ≤720px（`--bp-sheet`）時為 true。 */
export function useIsNarrow(): boolean {
  return useMediaQuery(NARROW_QUERY);
}
