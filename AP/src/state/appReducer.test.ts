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
 * US2 擴充（T062；FR-003、FR-009、FR-010、G-7、D-3）：
 *   toggleCharacter {id}、addCharacter {id}（面板維持開啟）、removeCharacter {id}、clearCharacters、
 *   toggleGroup {members}（群組成員 id 由容器自資料算出）、setQuery {query}、
 *   submitSearch {id: string | null}（容器以 enterSelectTarget 算出；只選取不取消）、clearFilters（清角色與大節）。
 *   選取規則本身由 domain/selection.test.ts 驗；此處驗 reducer 接線、冪等與其他欄位保留。
 *
 * | 特徵                      | blocks（非 base 者各為一案）                                  | 對應案例       |
 * | :------------------------ | :------------------------------------------------------------ | :------------- |
 * | U1 toggleCharacter 對象   | 未選／已選                                                    | CHR-1～CHR-2   |
 * | U2 addCharacter 前狀態    | 未選且面板開啟（面板保留）／已選（冪等）                      | CHR-3～CHR-4   |
 * | U3 removeCharacter 對象   | 已選／未選（冪等）                                            | CHR-5～CHR-6   |
 * | U4 clearCharacters 前狀態 | 有選取（大節保留）／已空（冪等）                              | CHR-7～CHR-8   |
 * | U5 toggleGroup 成員選取   | 未全選（加入並保留其他）／已全選（只移除成員）                | GRP-1～GRP-2   |
 * | U6 setQuery               | 新值（選取不變）／相同值（冪等）                              | QRY-1～QRY-2   |
 * | U7 submitSearch payload   | 未選 id（加入）／已選 id（不動作）／null（不動作）            | SUB-1～SUB-3   |
 * | U8 clearFilters 前狀態    | 有角色與大節（query 保留）／皆空（冪等）                      | CLR-1～CLR-2   |
 *
 * US3 擴充（T076；FR-011、FR-003 交集、FR-004 三視圖共用）：
 *   selectArc {id: string | null}：null＝「全部大節」；單選（新值取代舊值）；與既有角色選取並存（不清角色）。
 *   大節 × 角色交集由 domain/filter.test.ts 驗；此處驗 reducer 接線、冪等與其他欄位保留。
 *
 * | 特徵                      | blocks（非 base 者各為一案）                                  | 對應案例       |
 * | :------------------------ | :------------------------------------------------------------ | :------------- |
 * | A1 selectArc 前 arcId     | null（選大節）／他大節（取代）／同大節（冪等）                | ARC-1～ARC-3   |
 * | A2 selectArc payload      | 大節 id／null（回到全部大節）／null 且已是全部（冪等）        | ARC-1、ARC-4～ARC-5 |
 * | A3 既有角色選取與面板     | 有選取且面板開啟（皆保留）                                    | ARC-6          |
 *
 * US4 擴充（T086；FR-012、G-10(a)、AC-P21、AC-S23、AC-P19）：
 *   goToPlace {placeId, inShandong}：切到地圖視圖、設 focusPlace、關面板；`inShandong` 由容器以
 *   mapLayout.inScope('sd', place) 算出，reducer 不持有資料。目前 mapScope='sd' 且地點不在山東 → 切回 'all'。
 *   addCharacter 不關面板（AC-P19）已由 CHR-3 涵蓋。
 *
 * | 特徵                      | blocks（非 base 者各為一案）                                  | 對應案例       |
 * | :------------------------ | :------------------------------------------------------------ | :------------- |
 * | G1 goToPlace 前 mapScope × inShandong | all × true（base，範圍不變）／all × false（範圍不變）／sd × true（保留 sd）／sd × false（切回 all） | PLC-1～PLC-4 |
 * | G2 goToPlace 前 view 與面板 | 時間軸＋事件面板開啟（base：切 map、關面板）／已在 map 且無面板 | PLC-1、PLC-5 |
 * | G3 其他欄位               | 選取、大節、query 保留；focusPlace 由他地點取代               | PLC-6          |
 * | P1 純度                   | 不修改輸入狀態                                                | PURE-4         |
 *
 * US5 擴充（T099；FR-014、G-10(c)、AC-P25、AC-S25）：
 *   onlyCharacter {id}：選取改為只有 [id]（domain selection.only）並關閉面板；大節、query、view 保留。
 *   選取規則本身由 domain/selection.test.ts 驗；此處驗 reducer 接線與關面板。
 *
 * | 特徵                      | blocks（非 base 者各為一案）                                  | 對應案例       |
 * | :------------------------ | :------------------------------------------------------------ | :------------- |
 * | O1 onlyCharacter 前選取   | 有他人（取代為僅此人）／空（設為僅此人）／已是僅此人          | ONL-1～ONL-3   |
 * | O2 onlyCharacter 前面板   | 角色面板開啟（base：關閉）／未開                              | ONL-1、ONL-2   |
 * | O3 其他欄位               | 大節、query、view、mapScope、focusPlace 保留                  | ONL-4          |
 * | P1 純度                   | 不修改輸入狀態                                                | PURE-5         |
 *
 * US6 擴充（T115；FR-015～FR-018、AC-P26、AC-P28、AC-P36）：
 *   setMapScope {scope}：切換地圖範圍；focusPlace 保留（Prototype setScope 只改範圍）。
 *   focusPlace {placeId}：設焦點地點（標記高亮、側欄地點面板）；不切視圖、不動範圍。
 *   地點是否在篩選結果／範圍內由容器與 domain/mapLayout 處理；reducer 只記錄 id。
 *
 * | 特徵                      | blocks（非 base 者各為一案）                                  | 對應案例       |
 * | :------------------------ | :------------------------------------------------------------ | :------------- |
 * | M1 setMapScope 前後範圍   | all→sd（base）／sd→all／同範圍（冪等）                        | MAP-1～MAP-3   |
 * | M2 setMapScope 其他欄位   | focusPlace、選取、大節、view 保留                             | MAP-4          |
 * | F1 focusPlace 前焦點      | null（base）／他地點（取代）／同地點（冪等）                  | FOC-1～FOC-3   |
 * | F2 focusPlace 其他欄位    | view、mapScope、選取、面板保留                                | FOC-4          |
 * | P1 純度                   | 不修改輸入狀態                                                | PURE-6         |
 *
 * 範圍外（一次性宣告）：未知 action type（TypeScript 聯集排除）；面板 id 不存在（由容器自資料產生）；
 * 大節 id 不存在（選項由 arcs.json 產生）；
 * toggleGroup members 為空（由資料保證非空）。
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

const withSel = (selected: string[], extra: Partial<AppState> = {}): AppState => ({ ...base(), selected, ...extra });

describe('character selection actions (US2)', () => {
  it('CHR-1 toggleCharacter selects an unselected character (appended)', () => {
    const next = appReducer(withSel(['wusong']), { type: 'toggleCharacter', id: 'luzhishen' });
    expect(next.selected).toEqual(['wusong', 'luzhishen']);
  });

  it('CHR-2 toggleCharacter deselects a selected character', () => {
    const next = appReducer(withSel(['wusong', 'luzhishen']), { type: 'toggleCharacter', id: 'wusong' });
    expect(next.selected).toEqual(['luzhishen']);
  });

  it('CHR-3 addCharacter keeps the drawer open (AC-P19)', () => {
    const s = withSel([], { drawer: { kind: 'event', id: 'ev-08' } });
    const next = appReducer(s, { type: 'addCharacter', id: 'luzhishen' });
    expect(next.selected).toEqual(['luzhishen']);
    expect(next.drawer).toEqual({ kind: 'event', id: 'ev-08' });
  });

  it('CHR-4 addCharacter on an already selected character is idempotent', () => {
    const s = withSel(['linchong']);
    expect(appReducer(s, { type: 'addCharacter', id: 'linchong' })).toBe(s);
  });

  it('CHR-5 removeCharacter removes only that tag (AC-P11)', () => {
    const next = appReducer(withSel(['songjiang', 'likui']), { type: 'removeCharacter', id: 'songjiang' });
    expect(next.selected).toEqual(['likui']);
  });

  it('CHR-6 removeCharacter of a non-selected id is idempotent', () => {
    const s = withSel(['likui']);
    expect(appReducer(s, { type: 'removeCharacter', id: 'songjiang' })).toBe(s);
  });

  it('CHR-7 clearCharacters empties selection and keeps the arc', () => {
    const next = appReducer(withSel(['wusong', 'likui'], { arcId: 'arc-05' }), { type: 'clearCharacters' });
    expect(next.selected).toEqual([]);
    expect(next.arcId).toBe('arc-05');
  });

  it('CHR-8 clearCharacters when empty is idempotent', () => {
    const s = base();
    expect(appReducer(s, { type: 'clearCharacters' })).toBe(s);
  });
});

describe('toggleGroup (G-7)', () => {
  const members = ['songjiang', 'linchong', 'wusong'];

  it('GRP-1 not all selected → adds members and keeps others', () => {
    const next = appReducer(withSel(['chaogai', 'linchong']), { type: 'toggleGroup', members });
    expect(next.selected).toEqual(['chaogai', 'linchong', 'songjiang', 'wusong']);
  });

  it('GRP-2 all selected → removes only the members', () => {
    const s = withSel(['chaogai', 'songjiang', 'linchong', 'wusong']);
    expect(appReducer(s, { type: 'toggleGroup', members }).selected).toEqual(['chaogai']);
  });
});

describe('search actions (FR-009, D-3)', () => {
  it('QRY-1 setQuery stores the text and keeps the selection', () => {
    const next = appReducer(withSel(['linchong']), { type: 'setQuery', query: '黑旋風' });
    expect(next.query).toBe('黑旋風');
    expect(next.selected).toEqual(['linchong']);
  });

  it('QRY-2 setQuery with the same text is idempotent', () => {
    const s = withSel([], { query: '豹子頭' });
    expect(appReducer(s, { type: 'setQuery', query: '豹子頭' })).toBe(s);
  });

  it('SUB-1 submitSearch with an unselected id selects it (AC-P34)', () => {
    const next = appReducer(withSel(['wusong'], { query: '黑旋風' }), { type: 'submitSearch', id: 'likui' });
    expect(next.selected).toEqual(['wusong', 'likui']);
    expect(next.query).toBe('黑旋風');
  });

  it('SUB-2 submitSearch with an already selected id does not deselect (AC-S19)', () => {
    const s = withSel(['linchong']);
    expect(appReducer(s, { type: 'submitSearch', id: 'linchong' })).toBe(s);
  });

  it('SUB-3 submitSearch with null (no match) does nothing (AC-S19)', () => {
    const s = withSel(['linchong']);
    expect(appReducer(s, { type: 'submitSearch', id: null })).toBe(s);
  });
});

describe('clearFilters', () => {
  it('CLR-1 clears characters and arc, keeps query and view (AC-P14)', () => {
    const s = withSel(['wangying'], { arcId: 'arc-01', query: '王', view: 'graph' });
    const next = appReducer(s, { type: 'clearFilters' });
    expect(next).toEqual({ ...s, selected: [], arcId: null });
  });

  it('CLR-2 clearFilters with nothing to clear is idempotent', () => {
    const s = base();
    expect(appReducer(s, { type: 'clearFilters' })).toBe(s);
  });
});

describe('purity (US2 actions)', () => {
  it('PURE-2 selection actions do not mutate the input state', () => {
    const s = withSel(['wusong', 'linchong'], { arcId: 'arc-05' });
    const snapshot = structuredClone(s);
    appReducer(s, { type: 'toggleCharacter', id: 'wusong' });
    appReducer(s, { type: 'addCharacter', id: 'likui' });
    appReducer(s, { type: 'toggleGroup', members: ['wusong', 'likui'] });
    appReducer(s, { type: 'clearFilters' });
    expect(s).toEqual(snapshot);
  });
});

describe('selectArc (US3, FR-011)', () => {
  it('ARC-1 selects an arc from all arcs', () => {
    const next = appReducer(base(), { type: 'selectArc', id: 'arc-05' });
    expect(next).toEqual({ ...base(), arcId: 'arc-05' });
  });

  it('ARC-2 selecting another arc replaces the current one (single choice)', () => {
    const next = appReducer(withSel([], { arcId: 'arc-05' }), { type: 'selectArc', id: 'arc-03' });
    expect(next.arcId).toBe('arc-03');
  });

  it('ARC-3 selecting the current arc is idempotent', () => {
    const s = withSel([], { arcId: 'arc-05' });
    expect(appReducer(s, { type: 'selectArc', id: 'arc-05' })).toBe(s);
  });

  it('ARC-4 null returns to all arcs (AC-S14)', () => {
    const next = appReducer(withSel([], { arcId: 'arc-05' }), { type: 'selectArc', id: null });
    expect(next.arcId).toBeNull();
  });

  it('ARC-5 null when already all arcs is idempotent', () => {
    const s = base();
    expect(appReducer(s, { type: 'selectArc', id: null })).toBe(s);
  });

  it('ARC-6 keeps the character selection, query, view and drawer (FR-003 intersection, FR-004)', () => {
    const s = withSel(['wusong'], { query: '武', view: 'graph', drawer: { kind: 'event', id: 'ev-50' } });
    const next = appReducer(s, { type: 'selectArc', id: 'arc-12' });
    expect(next).toEqual({ ...s, arcId: 'arc-12' });
  });

  it('PURE-3 selectArc does not mutate the input state', () => {
    const s = withSel(['wusong'], { arcId: 'arc-05' });
    const snapshot = structuredClone(s);
    appReducer(s, { type: 'selectArc', id: 'arc-03' });
    appReducer(s, { type: 'selectArc', id: null });
    expect(s).toEqual(snapshot);
  });
});

describe('goToPlace (US4, FR-012, G-10(a))', () => {
  const opened = (extra: Partial<AppState> = {}): AppState =>
    withSel([], { drawer: { kind: 'event', id: 'ev-09' }, ...extra });

  it('PLC-1 switches to the map, focuses the place and closes the drawer (AC-P21)', () => {
    const next = appReducer(opened(), { type: 'goToPlace', placeId: '野豬林', inShandong: false });
    expect(next).toEqual({ ...base(), view: 'map', focusPlace: '野豬林', drawer: null });
  });

  it('PLC-2 scope all with a place outside 山東 keeps scope all', () => {
    const next = appReducer(opened(), { type: 'goToPlace', placeId: '孟州', inShandong: false });
    expect(next.mapScope).toBe('all');
  });

  it('PLC-3 scope sd with a place inside 山東 keeps scope sd', () => {
    const next = appReducer(opened({ mapScope: 'sd' }), { type: 'goToPlace', placeId: '梁山泊', inShandong: true });
    expect(next.mapScope).toBe('sd');
    expect(next.focusPlace).toBe('梁山泊');
  });

  it('PLC-4 scope sd with a place outside 山東 switches back to all (AC-S23)', () => {
    const next = appReducer(opened({ mapScope: 'sd' }), { type: 'goToPlace', placeId: '孟州', inShandong: false });
    expect(next).toEqual({ ...base(), view: 'map', mapScope: 'all', focusPlace: '孟州', drawer: null });
  });

  it('PLC-5 already on the map without a drawer still focuses the place', () => {
    const s = withSel([], { view: 'map' });
    const next = appReducer(s, { type: 'goToPlace', placeId: '梁山泊', inShandong: true });
    expect(next).toEqual({ ...s, focusPlace: '梁山泊' });
  });

  it('PLC-6 keeps selection, arc and query; replaces a previous focusPlace', () => {
    const s = opened({ selected: ['linchong'], arcId: 'arc-03', query: '林', focusPlace: '東京' });
    const next = appReducer(s, { type: 'goToPlace', placeId: '野豬林', inShandong: false });
    expect(next).toEqual({ ...s, view: 'map', focusPlace: '野豬林', drawer: null });
  });

  it('PURE-4 goToPlace does not mutate the input state', () => {
    const s = opened({ mapScope: 'sd', selected: ['wusong'] });
    const snapshot = structuredClone(s);
    appReducer(s, { type: 'goToPlace', placeId: '孟州', inShandong: false });
    expect(s).toEqual(snapshot);
  });
});

describe('onlyCharacter (US5, FR-014, G-10(c))', () => {
  const charOpen = (selected: string[], extra: Partial<AppState> = {}): AppState =>
    withSel(selected, { drawer: { kind: 'character', id: 'luzhishen' }, ...extra });

  it('ONL-1 replaces the selection with only this character and closes the drawer (AC-P25, AC-S25)', () => {
    const next = appReducer(charOpen(['linchong', 'wusong']), { type: 'onlyCharacter', id: 'luzhishen' });
    expect(next.selected).toEqual(['luzhishen']);
    expect(next.drawer).toBeNull();
  });

  it('ONL-2 with an empty selection and no drawer selects only this character', () => {
    const next = appReducer(base(), { type: 'onlyCharacter', id: 'luzhishen' });
    expect(next).toEqual({ ...base(), selected: ['luzhishen'] });
  });

  it('ONL-3 already only this character still closes the drawer', () => {
    const next = appReducer(charOpen(['luzhishen']), { type: 'onlyCharacter', id: 'luzhishen' });
    expect(next.selected).toEqual(['luzhishen']);
    expect(next.drawer).toBeNull();
  });

  it('ONL-4 keeps arc, query, view, map scope and focus place', () => {
    const s = charOpen(['linchong'], { arcId: 'arc-03', query: '魯', view: 'graph', mapScope: 'sd', focusPlace: '梁山泊' });
    const next = appReducer(s, { type: 'onlyCharacter', id: 'luzhishen' });
    expect(next).toEqual({ ...s, selected: ['luzhishen'], drawer: null });
  });

  it('PURE-5 onlyCharacter does not mutate the input state', () => {
    const s = charOpen(['linchong', 'wusong']);
    const snapshot = structuredClone(s);
    appReducer(s, { type: 'onlyCharacter', id: 'luzhishen' });
    expect(s).toEqual(snapshot);
  });
});

describe('map actions (US6, FR-015～FR-018)', () => {
  const onMap = (extra: Partial<AppState> = {}): AppState => withSel([], { view: 'map', ...extra });

  it('MAP-1 setMapScope switches all → sd (AC-P36)', () => {
    const next = appReducer(onMap(), { type: 'setMapScope', scope: 'sd' });
    expect(next).toEqual({ ...onMap(), mapScope: 'sd' });
  });

  it('MAP-2 setMapScope switches sd → all', () => {
    const next = appReducer(onMap({ mapScope: 'sd' }), { type: 'setMapScope', scope: 'all' });
    expect(next.mapScope).toBe('all');
  });

  it('MAP-3 setMapScope with the current scope is idempotent', () => {
    const s = onMap({ mapScope: 'sd' });
    expect(appReducer(s, { type: 'setMapScope', scope: 'sd' })).toBe(s);
  });

  it('MAP-4 setMapScope keeps focus place, selection, arc and view', () => {
    const s = onMap({ selected: ['wusong'], arcId: 'arc-05', focusPlace: '東京' });
    const next = appReducer(s, { type: 'setMapScope', scope: 'sd' });
    expect(next).toEqual({ ...s, mapScope: 'sd' });
  });

  it('FOC-1 focusPlace sets the focus place (AC-P28)', () => {
    const next = appReducer(onMap(), { type: 'focusPlace', placeId: '梁山泊' });
    expect(next).toEqual({ ...onMap(), focusPlace: '梁山泊' });
  });

  it('FOC-2 focusPlace replaces a previous focus place', () => {
    const next = appReducer(onMap({ focusPlace: '東京' }), { type: 'focusPlace', placeId: '孟州' });
    expect(next.focusPlace).toBe('孟州');
  });

  it('FOC-3 focusPlace on the current focus place is idempotent', () => {
    const s = onMap({ focusPlace: '孟州' });
    expect(appReducer(s, { type: 'focusPlace', placeId: '孟州' })).toBe(s);
  });

  it('FOC-4 focusPlace keeps view, scope, selection and drawer', () => {
    const s = onMap({ mapScope: 'sd', selected: ['wusong'], drawer: { kind: 'event', id: 'ev-09' } });
    const next = appReducer(s, { type: 'focusPlace', placeId: '梁山泊' });
    expect(next).toEqual({ ...s, focusPlace: '梁山泊' });
  });

  it('PURE-6 map actions do not mutate the input state', () => {
    const s = onMap({ focusPlace: '東京', selected: ['wusong'] });
    const snapshot = structuredClone(s);
    appReducer(s, { type: 'setMapScope', scope: 'sd' });
    appReducer(s, { type: 'focusPlace', placeId: '孟州' });
    expect(s).toEqual(snapshot);
  });
});
