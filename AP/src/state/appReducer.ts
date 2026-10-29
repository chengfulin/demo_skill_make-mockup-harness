/**
 * App 狀態 reducer（plan「狀態（React Context + useReducer）」）。
 *
 * 純函式：不持有資料內容（資料由 DatasetProvider 提供），篩選結果不存 state（由 selectors 即時算出）。
 * Action 聯集由本 phase 的基礎 action 起步，US2～US6 依序擴充（在 `Action` 加成員、在 switch 加分支）。
 */

/** 三個視圖（hash `#timeline`／`#map`／`#graph`）。 */
export type View = 'timeline' | 'map' | 'graph';

/** 地圖範圍（同 `domain/mapLayout` 的 `MapScopeId`）。 */
export type MapScope = 'all' | 'sd';

/** 面板：同時最多開一個。 */
export type Drawer = { kind: 'event'; id: string } | { kind: 'character'; id: string };

export interface AppState {
  /** 已選角色 id，依加入順序（已選標籤照此順序） */
  selected: string[];
  /** 大節 id；null = 全部大節 */
  arcId: string | null;
  /** 搜尋框內容 */
  query: string;
  /** 目前視圖 */
  view: View;
  /** 地圖範圍 */
  mapScope: MapScope;
  /** 地圖高亮與側欄的地點 id */
  focusPlace: string | null;
  /** 開啟中的面板 */
  drawer: Drawer | null;
}

// ---- Actions（各 story 擴充時在此加成員） ----
export type SetViewAction = { type: 'setView'; view: View };
export type OpenEventAction = { type: 'openEvent'; id: string };
export type OpenCharacterAction = { type: 'openCharacter'; id: string };
export type CloseDrawerAction = { type: 'closeDrawer' };

export type Action = SetViewAction | OpenEventAction | OpenCharacterAction | CloseDrawerAction;

/** 初始狀態；`view` 由呼叫端（hash 解析結果）提供。 */
export function createInitialState(view: View): AppState {
  return {
    selected: [],
    arcId: null,
    query: '',
    view,
    mapScope: 'all',
    focusPlace: null,
    drawer: null,
  };
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setView':
      return state.view === action.view ? state : { ...state, view: action.view };
    case 'openEvent':
      return { ...state, drawer: { kind: 'event', id: action.id } };
    case 'openCharacter':
      return { ...state, drawer: { kind: 'character', id: action.id } };
    case 'closeDrawer':
      return state.drawer === null ? state : { ...state, drawer: null };
    default: {
      const unhandled: never = action;
      return unhandled;
    }
  }
}
