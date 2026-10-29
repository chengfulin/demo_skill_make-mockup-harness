/**
 * App 狀態 reducer（基礎；T024；plan「狀態（React Context + useReducer）」）
 *
 * 介面（T028 依此實作；US2～US6 再擴充 Action）：
 *   createInitialState(view) → { selected: [], arcId: null, query: '', view, mapScope: 'all',
 *                                focusPlace: null, drawer: null }
 *   appReducer(state, action)：純函式，不修改輸入、不持有資料內容。
 *   本 phase 的 Action：setView、openEvent、openCharacter、closeDrawer。
 *   drawer 同時最多一個：開另一個面板即取代。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：初始狀態（view='timeline'、drawer=null）
 *
 * | 特徵                  | blocks（非 base 者各為一案）                                   | 對應案例       |
 * | :-------------------- | :------------------------------------------------------------- | :------------- |
 * | I1 初始 view 參數     | timeline（base）／map／graph                                   | INIT-1～INIT-2 |
 * | V1 setView 目標       | 不同於目前／與目前相同（冪等）                                 | VIEW-1～VIEW-2 |
 * | D1 開啟前 drawer      | null（base）／已開事件／已開角色                               | DRW-1～DRW-4   |
 * | D2 開啟的面板種類     | event／character                                               | DRW-1～DRW-4   |
 * | D3 closeDrawer 前狀態 | 已開面板／未開（冪等）                                         | DRW-5～DRW-6   |
 * | P1 純度               | 不修改輸入狀態；其他欄位保留                                   | PURE-1         |
 *
 * 範圍外（一次性宣告）：未知 action type（TypeScript 聯集排除）；面板 id 不存在（由容器自資料產生）；
 * 篩選、地圖、搜尋類 action（US2～US6 擴充時各自補測）。
 */
import { describe, expect, it } from 'vitest';
import { appReducer, createInitialState, type AppState } from './appReducer';

const base = (): AppState => createInitialState('timeline');

describe('createInitialState', () => {
  it('BASE initial state with view timeline', () => {
    expect(base()).toEqual({
      selected: [],
      arcId: null,
      query: '',
      view: 'timeline',
      mapScope: 'all',
      focusPlace: null,
      drawer: null,
    });
  });

  it('INIT-1 view comes from the argument (map)', () => {
    expect(createInitialState('map').view).toBe('map');
  });

  it('INIT-2 view comes from the argument (graph)', () => {
    expect(createInitialState('graph').view).toBe('graph');
  });
});

describe('setView', () => {
  it('VIEW-1 switches to another view and keeps other fields', () => {
    const next = appReducer(base(), { type: 'setView', view: 'map' });
    expect(next).toEqual({ ...base(), view: 'map' });
  });

  it('VIEW-2 same view is idempotent (returns the same state)', () => {
    const s = base();
    expect(appReducer(s, { type: 'setView', view: 'timeline' })).toBe(s);
  });
});

describe('drawer actions', () => {
  it('DRW-1 openEvent from closed', () => {
    const next = appReducer(base(), { type: 'openEvent', id: 'ev-08' });
    expect(next.drawer).toEqual({ kind: 'event', id: 'ev-08' });
  });

  it('DRW-2 openCharacter from closed', () => {
    const next = appReducer(base(), { type: 'openCharacter', id: 'linchong' });
    expect(next.drawer).toEqual({ kind: 'character', id: 'linchong' });
  });

  it('DRW-3 openCharacter replaces an open event drawer', () => {
    const s = appReducer(base(), { type: 'openEvent', id: 'ev-08' });
    const next = appReducer(s, { type: 'openCharacter', id: 'luzhishen' });
    expect(next.drawer).toEqual({ kind: 'character', id: 'luzhishen' });
  });

  it('DRW-4 openEvent replaces an open character drawer (and another event)', () => {
    const s = appReducer(base(), { type: 'openCharacter', id: 'linchong' });
    const s2 = appReducer(s, { type: 'openEvent', id: 'ev-08' });
    expect(s2.drawer).toEqual({ kind: 'event', id: 'ev-08' });
    const s3 = appReducer(s2, { type: 'openEvent', id: 'ev-09' });
    expect(s3.drawer).toEqual({ kind: 'event', id: 'ev-09' });
  });

  it('DRW-5 closeDrawer closes an open drawer', () => {
    const s = appReducer(base(), { type: 'openEvent', id: 'ev-08' });
    expect(appReducer(s, { type: 'closeDrawer' }).drawer).toBeNull();
  });

  it('DRW-6 closeDrawer when closed is idempotent', () => {
    const s = base();
    expect(appReducer(s, { type: 'closeDrawer' })).toBe(s);
  });
});

describe('purity', () => {
  it('PURE-1 does not mutate the input state', () => {
    const s = { ...base(), selected: ['wusong'] };
    const snapshot = structuredClone(s);
    appReducer(s, { type: 'openEvent', id: 'ev-08' });
    appReducer(s, { type: 'setView', view: 'graph' });
    expect(s).toEqual(snapshot);
  });
});
