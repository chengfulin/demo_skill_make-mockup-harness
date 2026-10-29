/**
 * App 狀態 reducer（plan「狀態（React Context + useReducer）」）。
 *
 * 純函式：不持有資料內容（資料由 DatasetProvider 提供），篩選結果不存 state（由 selectors 即時算出）。
 * Action 聯集由本 phase 的基礎 action 起步，US2～US6 依序擴充（US6：`setMapScope`、`focusPlace`）（在 `Action` 加成員、在 switch 加分支）。
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

// US3 大節篩選（FR-011；與角色篩選並存取交集 FR-003；三視圖共用 FR-004）
/** 選大節；`id` 為 null＝「全部大節」。單選：新值取代舊值，不動角色選取 */
export type SelectArcAction = { type: 'selectArc'; id: string | null };

// US4 事件明細（FR-012、G-10(a)、AC-P21、AC-S23）
/**
 * 點事件地點「在地圖上看」：切到地圖、設焦點地點、關面板。
 * `inShandong` 由容器以 `mapLayout.inScope('sd', place)` 算出（reducer 不持有資料）；
 * 目前範圍為「山東」而地點在範圍外時自動切回「全圖」。
 */
export type GoToPlaceAction = { type: 'goToPlace'; placeId: string; inShandong: boolean };

// US5 角色資料（FR-014、G-10(c)、AC-P25、AC-S25）
/** 「只看此角色」：選取改為僅此人並關閉面板 */
export type OnlyCharacterAction = { type: 'onlyCharacter'; id: string };

// US6 地圖（FR-015～FR-018、AC-P26、AC-P28、AC-P36）
/** 地圖範圍切換（範圍分頁、全圖上的山東框）；焦點地點保留（Prototype `setScope`） */
export type SetMapScopeAction = { type: 'setMapScope'; scope: MapScope };
/** 點地圖標記：設焦點地點（高亮與側欄地點面板） */
export type FocusPlaceAction = { type: 'focusPlace'; placeId: string };

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
  | ClearFiltersAction
  | SelectArcAction
  | GoToPlaceAction
  | OnlyCharacterAction
  | SetMapScopeAction
  | FocusPlaceAction;

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
    case 'selectArc':
      return state.arcId === action.id ? state : { ...state, arcId: action.id };
    case 'goToPlace':
      return {
        ...state,
        view: 'map',
        mapScope: state.mapScope === 'sd' && !action.inShandong ? 'all' : state.mapScope,
        focusPlace: action.placeId,
        drawer: null,
      };
    case 'onlyCharacter':
      return { ...state, selected: selection.only(action.id), drawer: null };
    case 'setMapScope':
      return state.mapScope === action.scope ? state : { ...state, mapScope: action.scope };
    case 'focusPlace':
      return state.focusPlace === action.placeId ? state : { ...state, focusPlace: action.placeId };
    default: {
      const unhandled: never = action;
      return unhandled;
    }
  }
}
