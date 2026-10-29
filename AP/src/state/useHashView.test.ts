/**
 * 網址 hash ↔ 視圖同步（T040，US1；測試先行，T045 實作後轉綠）
 *
 * 依據：plan「路由（hash）」、research「不引入路由套件」；spec FR-005（hash 只記視圖、篩選不寫進網址）、
 *       AC-S17（無 hash 或無法辨識的 hash → 時間軸）。
 *
 * 介面（T045 依此實作；T046 AppStateProvider 使用）：
 *   readHashView(hash = location.hash): View        // '#timeline'｜'#map'｜'#graph' 以外一律 'timeline'
 *   writeHashView(view): void                       // history.replaceState 寫回 `#<view>`，保留 path 與 query；
 *                                                   // 已相同則不呼叫（不產生多餘歷史操作）
 *   useHashSync(view, onChange): void               // view 變動 → writeHashView；hashchange → onChange(readHashView())
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：hash 為 `#timeline`、view 為 timeline
 *
 * | 特徵                 | blocks（非 base 者各為一案）                                  | 對應案例        |
 * | :------------------- | :------------------------------------------------------------ | :-------------- |
 * | H1 hash 內容         | #timeline（base）／空／無法辨識（#foo、#Map）／#map／#graph   | READ-1～READ-4  |
 * | W1 寫回目標          | 與目前 hash 不同／相同（不呼叫 replaceState）                 | WRITE-1、WRITE-2 |
 * | W2 網址其他部分      | 有 path 與 query → 保留，只換 hash                            | WRITE-3         |
 * | S1 hook 觸發來源     | 初次掛載／view prop 改變／hashchange 事件／onChange 換參照    | SYNC-1～SYNC-4  |
 *
 * 範圍外（主要流程外，一次性宣告）：SSR（無 window）；瀏覽器上一頁／下一頁（replaceState 不產生歷史紀錄，E2E 驗重新開啟）；
 * 篩選狀態本身（本模組只接受 View，篩選無從寫入；SYNC-2 驗網址只含 `#<view>`）。
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readHashView, useHashSync, writeHashView } from './useHashView';

function setUrl(url: string) {
  window.history.replaceState(null, '', url);
}

beforeEach(() => {
  setUrl('/#timeline');
});

afterEach(() => {
  vi.restoreAllMocks();
  setUrl('/');
});

describe('readHashView', () => {
  it('BASE #timeline -> timeline', () => {
    expect(readHashView()).toBe('timeline');
  });

  // READ-1：沒有 hash（AC-S17）
  it('READ-1 empty hash -> timeline', () => {
    setUrl('/');
    expect(readHashView()).toBe('timeline');
    expect(readHashView('')).toBe('timeline');
    expect(readHashView('#')).toBe('timeline');
  });

  // READ-2：無法辨識（AC-S17；大小寫不同亦視為無法辨識）
  it('READ-2 unknown hash -> timeline', () => {
    setUrl('/#foo');
    expect(readHashView()).toBe('timeline');
    expect(readHashView('#Map')).toBe('timeline');
    expect(readHashView('#map?x=1')).toBe('timeline');
  });

  it('READ-3 #map -> map', () => {
    setUrl('/#map');
    expect(readHashView()).toBe('map');
  });

  it('READ-4 #graph -> graph', () => {
    expect(readHashView('#graph')).toBe('graph');
  });
});

describe('writeHashView', () => {
  // WRITE-1：以 replaceState 寫回（不 pushState）
  it('WRITE-1 writes #<view> with replaceState', () => {
    const replace = vi.spyOn(window.history, 'replaceState');
    const push = vi.spyOn(window.history, 'pushState');
    writeHashView('map');
    expect(replace).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#map');
  });

  // WRITE-2：已相同則不呼叫
  it('WRITE-2 does nothing when the hash already matches', () => {
    const replace = vi.spyOn(window.history, 'replaceState');
    writeHashView('timeline');
    expect(replace).not.toHaveBeenCalled();
  });

  // WRITE-3：保留 path 與 query
  it('WRITE-3 keeps path and query, only replaces the hash', () => {
    setUrl('/sub/?lang=zh#foo');
    writeHashView('graph');
    expect(window.location.pathname).toBe('/sub/');
    expect(window.location.search).toBe('?lang=zh');
    expect(window.location.hash).toBe('#graph');
  });
});

describe('useHashSync', () => {
  // SYNC-1：初次掛載即寫回目前 view（無效 hash 正規化為 #timeline）
  it('SYNC-1 writes the current view on mount', () => {
    setUrl('/#foo');
    renderHook(() => useHashSync('timeline', vi.fn()));
    expect(window.location.hash).toBe('#timeline');
  });

  // SYNC-2：view 改變寫回；網址只含 #<view>（篩選不寫入，FR-005）
  it('SYNC-2 writes back when view changes; URL holds only the view', () => {
    const { rerender } = renderHook(({ view }) => useHashSync(view, vi.fn()), {
      initialProps: { view: 'timeline' as 'timeline' | 'map' | 'graph' },
    });
    rerender({ view: 'map' });
    expect(window.location.hash).toBe('#map');
    expect(window.location.href).toBe(`${window.location.origin}/#map`);
  });

  // SYNC-3：hashchange 事件 → onChange(解析後的 view)；無法辨識 → timeline
  it('SYNC-3 hashchange calls onChange with the parsed view', () => {
    const onChange = vi.fn();
    renderHook(() => useHashSync('timeline', onChange));
    act(() => {
      setUrl('/#graph');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(onChange).toHaveBeenLastCalledWith('graph');
    act(() => {
      setUrl('/#nope');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(onChange).toHaveBeenLastCalledWith('timeline');
  });

  // SYNC-4：onChange 換參照不重寫網址，hashchange 呼叫最新的 onChange；卸載後不再監聽
  it('SYNC-4 uses the latest onChange and stops listening after unmount', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(({ cb }) => useHashSync('timeline', cb), {
      initialProps: { cb: first },
    });
    const replace = vi.spyOn(window.history, 'replaceState');
    rerender({ cb: second });
    expect(replace).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('timeline');

    unmount();
    second.mockClear();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(second).not.toHaveBeenCalled();
  });
});
