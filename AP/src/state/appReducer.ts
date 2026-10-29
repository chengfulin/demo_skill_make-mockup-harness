/**
 * App 狀態 reducer（plan「狀態（React Context + useReducer）」）。
 *
 * 純函式：不持有資料內容（資料由 DatasetProvider 提供），篩選結果不存 state（由 selectors 即時算出）。
 * Action 聯集由本 phase 的基礎 action 起步，US2～US6 依序擴充（在 `Action` 加成員、在 switch 加分支）。
 */
import * as selection from '../domain/selection';

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

// US2 角色篩選（FR-003、FR-009、FR-010）
export type ToggleCharacterAction = { type: 'toggleCharacter'; id: string };
/** 加入篩選（已選則不動作）；不關面板（AC-P19） */
export type AddCharacterAction = { type: 'addCharacter'; id: string };
export type RemoveCharacterAction = { type: 'removeCharacter'; id: string };
export type ClearCharactersAction = { type: 'clearCharacters' };
/** 天罡／地煞快選；`members` 為群組成員 id，由容器自資料算出（reducer 不持有資料，G-7） */
export type ToggleGroupAction = { type: 'toggleGroup'; members: readonly string[] };
export type SetQueryAction = { type: 'setQuery'; query: string };
/** 搜尋框 Enter；`id` 為 `search.enterSelectTarget` 的結果，null＝不動作（D-3：只選取不取消） */
export type SubmitSearchAction = { type: 'submitSearch'; id: string | null };
/** 清除角色與大節篩選（空狀態「清除篩選」，AC-P14） */
export type ClearFiltersAction = { type: 'clearFilters' };

export type Action =
  | SetViewAction
  | OpenEventAction
  | OpenCharacterAction
  | CloseDrawerAction
  | ToggleCharacterAction
  | AddCharacterAction
  | RemoveCharacterAction
  | ClearCharactersAction
  | ToggleGroupAction
  | SetQueryAction
  | SubmitSearchAction
  | ClearFiltersAction;

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

/** 以新選取更新狀態；選取未變（同一參照）時回傳原狀態（冪等）。 */
function withSelected(state: AppState, selected: string[]): AppState {
  return selected === state.selected ? state : { ...state, selected };
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
    case 'toggleCharacter':
      return withSelected(state, selection.toggle(state.selected, action.id));
    case 'addCharacter':
      return withSelected(state, selection.add(state.selected, action.id));
    case 'removeCharacter':
      return withSelected(state, selection.remove(state.selected, action.id));
    case 'clearCharacters':
      return state.selected.length === 0 ? state : { ...state, selected: selection.clear() };
    case 'toggleGroup':
      return withSelected(state, selection.groupToggle(state.selected, action.members));
    case 'setQuery':
      return state.query === action.query ? state : { ...state, query: action.query };
    case 'submitSearch':
      return action.id === null ? state : withSelected(state, selection.add(state.selected, action.id));
    case 'clearFilters':
      return state.selected.length === 0 && state.arcId === null
        ? state
        : { ...state, selected: selection.clear(), arcId: null };
    default: {
      const unhandled: never = action;
      return unhandled;
    }
  }
}
