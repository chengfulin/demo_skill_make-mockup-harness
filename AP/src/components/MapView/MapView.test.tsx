/**
 * MapView（S5 地圖）展示元件測試（T116，US6；測試先行，T121～T125 實作後轉綠）
 *
 * 依據：contracts/ui-contracts.md「S5 地圖」區塊順序、元件對照、逐字文案與狀態；
 *       Prototype `renderMap`（section[data-page] > .mapgrid > .mapcol(.maptools > .tabs → .mapbox → .mapruler) + .side）；
 *       spec AC-14、AC-15、AC-P27、AC-P28、AC-P35、AC-P36、AC-S11、FR-015～FR-018。
 *
 * 本測試同時定義 T121～T125 的 props 介面（展示元件只吃 props，plan「元件分層」）：
 *   - `MapView`（./MapView）：
 *       { scope: MapScopeId; onScopeChange: (scope) => void;          // 範圍切換與山東框（AC-P36）
 *         markers: readonly MapMarker[];                             // mapLayout.buildMarkers 結果
 *         trail: TrailGeometry | null;                               // mapLayout.projectTrail（只選一位才給）
 *         focusPlaceId: string | null; onSelectPlace: (placeId) => void;
 *         unlocated: number;                                         // mapLayout.unlocatedCount
 *         events: readonly StoryEvent[];                             // 篩選結果（刻度直線、結果 0 時覆蓋空狀態）
 *         range: ChapterRange; arcName: string | null;               // 刻度範圍與說明
 *         focusPlaceName: string | null; focusEvents: readonly StoryEvent[];  // 側欄地點面板
 *         trailOwnerName: string | null; selectedCount: number;      // 側欄說明面板
 *         onOpenEvent: (eventId) => void; onClearFilters: () => void }
 *   - 子元件：`ScopeSwitch`、`MapSvg`（含 `MapMarker`）、`MapRuler`、`MapSidePanel`（props 為上列子集）
 *   - DOM：標記為 `g[role=button][tabindex=0]`（焦點加 `.hi`）；山東框 `g.sdbox[role=button]`；
 *     行跡 `polyline.trail` ＋ `text.trailno`；刻度 `.mini[aria-label=章回範圍]` 內 `.tk` 直線、`.lb` 數字
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：真實資料、未篩選（54 事件）、scope=all、無焦點地點、無行跡、無大節
 *
 * | 特徵                 | blocks（非 base 者各為一案）                              | 對應案例          |
 * | :------------------- | :-------------------------------------------------------- | :---------------- |
 * | L1 區塊順序          | 寬螢幕 DOM 順序（base）                                   | MV-1              |
 * | S1 範圍              | all（base：北宋疆域、山東框、全圖註記）／sd               | MV-2、MV-3        |
 * | A1 範圍操作          | 點「山東」分頁／點山東框／山東框按 Enter                  | MV-4              |
 * | K1 標記              | 名稱＋事件數（base）／焦點地點 .hi／點擊／Enter／Space    | MV-5、MV-6        |
 * | T1 行跡              | 無（base）／有（虛線＋順序號）                            | MV-7              |
 * | U1 無法定位          | 0（不顯示）／1（右上提示）                                | MV-8              |
 * | R1 刻度              | 全書（base）／大節（加大節名）                            | MV-9              |
 * | P1 地點面板          | 未選（base）／已選有事件（點事件）／焦點不在結果中        | MV-10、MV-11      |
 * | D1 說明面板          | 未選角色（base）／單一角色／多角色                        | MV-12             |
 * | N1 事件數            | 54（base）／0（EmptyState 覆蓋）                          | MV-13             |
 *
 * 範圍外（一次性宣告）：SVG 實際像素與縮放、刻度與地圖同寬、窄螢幕單欄（jsdom 無版面；E2E 驗 AC-P39）；
 * 標記座標與推開（mapLayout.test 驗）；底圖折線數值（Prototype 常數，mapGeometry 照抄）。
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { filterEvents } from '../../domain/filter';
import {
  buildMarkers,
  buildTrail,
  eventsAtPlace,
  projectTrail,
  unlocatedCount,
  type MapScopeId,
} from '../../domain/mapLayout';
import type { ChapterRange, StoryEvent } from '../../domain/types';
import { arcIdOf, idOf, realDataset } from '../../test-utils/realDataset';
import { MapView, type MapViewProps } from './MapView';

const { events: book, placeById } = realDataset;
const squash = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, '');

interface Opts {
  names?: string[];
  arc?: string;
  scope?: MapScopeId;
  focus?: string | null;
}

function setup({ names = [], arc, scope = 'all', focus = null }: Opts = {}) {
  const arcId = arc ? arcIdOf(arc) : null;
  const events = filterEvents(book, names.map(idOf), arcId);
  const single = names.length === 1 ? idOf(names[0]) : null;
  const range: ChapterRange = arcId ? realDataset.arcById.get(arcId)!.chapters : [1, 120];
  const props: MapViewProps = {
    scope,
    onScopeChange: vi.fn(),
    markers: buildMarkers(events, placeById, scope),
    trail: single ? projectTrail(buildTrail(events, single), placeById, scope) : null,
    focusPlaceId: focus,
    onSelectPlace: vi.fn(),
    unlocated: unlocatedCount(events),
    events,
    range,
    arcName: arc ?? null,
    focusPlaceName: focus,
    focusEvents: focus ? eventsAtPlace(events, focus) : [],
    trailOwnerName: single ? names[0] : null,
    selectedCount: names.length,
    onOpenEvent: vi.fn(),
    onClearFilters: vi.fn(),
  };
  const view = render(<MapView {...props} />);
  return { ...view, props, user: userEvent.setup() };
}

const section = () => document.querySelector<HTMLElement>('section[data-page="S5 地圖"]')!;
const mapBox = () => screen.getByTestId('map');
const side = () => screen.getByTestId('map-side');
const marker = (name: string, n: number) =>
  within(mapBox()).getByRole('button', { name: `${name}，${n} 個事件` });

describe('MapView (S5)', () => {
  it('MV-1 block order: scope tabs -> map -> ruler + caption; side: place panel -> description panel', () => {
    setup();
    const s = section();
    expect(s).toBeInTheDocument();
    const tablist = within(s).getByRole('tablist', { name: '地圖範圍' });
    const map = mapBox();
    const ruler = within(s).getByLabelText('章回範圍');
    const order = (a: Node, b: Node) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
    expect(order(tablist, map)).toBeTruthy();
    expect(order(map, ruler)).toBeTruthy();
    const panels = side().querySelectorAll('.panel');
    expect(panels).toHaveLength(2);
    expect(within(panels[0] as HTMLElement).getByRole('heading').textContent).toBe('地點');
    expect(within(panels[1] as HTMLElement).getByRole('heading').textContent).toBe('目前篩選');
    expect(order(map, side())).toBeTruthy();
  });

  it('MV-2 (AC-P35, AC-S11) full map: tabs 全圖 selected, SVG name, Shandong box, notes, 32 markers', () => {
    setup();
    const tabs = within(screen.getByRole('tablist', { name: '地圖範圍' })).getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['全圖', '山東']);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(within(mapBox()).getByRole('img', { name: '北宋疆域示意地圖' })).toBeInTheDocument();
    const box = mapBox().querySelector('.sdbox')!;
    expect(box).toHaveAttribute('aria-label', '放大山東');
    expect(box.textContent).toBe('山東 · 點此放大');
    const text = mapBox().textContent ?? '';
    for (const t of ['黃河（北宋河道示意）', '長江', '東海']) expect(text).toContain(t);
    expect(mapBox().querySelector('.mapnote')?.textContent).toBe('示意，非精確測繪');
    expect(mapBox().querySelectorAll('g.mk')).toHaveLength(32);
    expect(mapBox().querySelector('.trail')).toBeNull();
  });

  it('MV-3 (AC-P36, AC-S11) Shandong: SVG name, no box, Shandong notes, 15 markers', () => {
    setup({ scope: 'sd' });
    expect(within(mapBox()).getByRole('img', { name: '山東範圍示意地圖' })).toBeInTheDocument();
    expect(mapBox().querySelector('.sdbox')).toBeNull();
    const text = mapBox().textContent ?? '';
    expect(text).toContain('黃海');
    expect(text).not.toContain('長江');
    expect(mapBox().querySelector('.mapnote')?.textContent).toBe('示意，非精確測繪 · 山東範圍外的地點不顯示');
    expect(mapBox().querySelectorAll('g.mk')).toHaveLength(15);
    expect(screen.getByRole('tab', { name: '山東' })).toHaveAttribute('aria-selected', 'true');
  });

  it('MV-4 (AC-P36) scope tab, Shandong box click and Enter call onScopeChange', async () => {
    const { props, user } = setup();
    await user.click(screen.getByRole('tab', { name: '山東' }));
    expect(props.onScopeChange).toHaveBeenLastCalledWith('sd');
    await user.click(screen.getByRole('tab', { name: '全圖' }));
    expect(props.onScopeChange).toHaveBeenLastCalledWith('all');
    const box = within(mapBox()).getByRole('button', { name: '放大山東' });
    await user.click(box);
    expect(props.onScopeChange).toHaveBeenLastCalledWith('sd');
    expect(props.onScopeChange).toHaveBeenCalledTimes(3);
    box.focus();
    await user.keyboard('{Enter}');
    expect(props.onScopeChange).toHaveBeenCalledTimes(4);
  });

  it('MV-5 (FR-015) marker shows count and name, aria-label "<name>，<N> 個事件", focused place is .hi', () => {
    setup({ focus: '梁山泊' });
    const m = marker('梁山泊', 7);
    expect(m).toHaveAttribute('tabindex', '0');
    expect(m).toHaveClass('hi');
    expect(squash(m.textContent)).toBe('7梁山泊');
    expect(marker('東京', 6)).not.toHaveClass('hi');
  });

  it('MV-6 (AC-P28) click / Enter / Space on a marker calls onSelectPlace', async () => {
    const { props, user } = setup({ names: ['武松', '宋江'] });
    await user.click(marker('江州', 3));
    expect(props.onSelectPlace).toHaveBeenLastCalledWith('江州');
    marker('東京', 1).focus();
    await user.keyboard('{Enter}');
    expect(props.onSelectPlace).toHaveBeenLastCalledWith('東京');
    marker('杭州', 2).focus();
    await user.keyboard(' ');
    expect(props.onSelectPlace).toHaveBeenLastCalledWith('杭州');
    expect(props.onSelectPlace).toHaveBeenCalledTimes(3);
  });

  it('MV-7 (AC-14, FR-016) single character: dashed trail and step numbers 1..n', () => {
    setup({ names: ['武松'] });
    expect(mapBox().querySelectorAll('g.mk')).toHaveLength(8);
    expect(mapBox().querySelectorAll('polyline.trail')).toHaveLength(1);
    const nos = [...mapBox().querySelectorAll('.trailno')].map((n) => n.textContent);
    expect(nos).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('MV-8 (AC-15, AC-P27) multiple characters: no trail; unlocated note top-right', () => {
    setup({ names: ['武松', '宋江'] });
    expect(mapBox().querySelector('.trail')).toBeNull();
    expect(mapBox().querySelector('.unloc')?.textContent).toBe('1 個事件無法標示地點');
  });

  it('MV-8b no unlocated note when count is 0', () => {
    setup({ names: ['武松'] });
    expect(mapBox().querySelector('.unloc')).toBeNull();
  });

  it('MV-9 (FR-018) ruler: labels 1/30/60/90/120, one line per event, caption with optional arc name', () => {
    const { unmount } = setup();
    const ruler = screen.getByLabelText('章回範圍');
    expect([...ruler.querySelectorAll('.lb')].map((n) => n.textContent)).toEqual(['1', '30', '60', '90', '120']);
    expect(ruler.querySelectorAll('.tk')).toHaveLength(54);
    expect(squash(section().querySelector('.mapruler')?.textContent)).toContain(
      squash('章回刻度 · 第 1–120 回，共 54 個事件，直線標出各事件的起始回'),
    );
    unmount();
    setup({ arc: '三打祝家莊' });
    expect(squash(section().querySelector('.mapruler')?.textContent)).toContain(
      squash('章回刻度 · 三打祝家莊，第 43–50 回，共 4 個事件，直線標出各事件的起始回'),
    );
  });

  it('MV-10 (AC-P28) place panel lists events of the focused place; clicking opens the event', async () => {
    const { props, user } = setup({ names: ['武松', '宋江'], focus: '江州' });
    const panel = side().querySelectorAll<HTMLElement>('.panel')[0];
    expect(within(panel).getByRole('heading').textContent).toBe('江州');
    expect(squash(panel.textContent)).toContain('3個事件');
    const rows = within(panel).getAllByRole('button');
    expect(rows.map((r) => squash(r.textContent))).toEqual([
      '38回江州結識戴宗・李逵',
      '39回潯陽樓吟反詩',
      '40–41回江州劫法場',
    ]);
    await user.click(rows[2]);
    const id = book.find((e) => e.title === '江州劫法場')!.id;
    expect(props.onOpenEvent).toHaveBeenCalledWith(id);
  });

  it('MV-11 place panel when nothing / an out-of-result place is focused', () => {
    const { unmount } = setup();
    const p0 = side().querySelectorAll<HTMLElement>('.panel')[0];
    expect(within(p0).getByRole('heading').textContent).toBe('地點');
    expect(p0.textContent).toContain('點地圖上的標記，列出在該地發生的事件。');
    expect(p0.textContent).not.toContain('不在目前的篩選結果中');
    unmount();
    setup({ names: ['武松'], focus: '江州' });
    const p1 = side().querySelectorAll<HTMLElement>('.panel')[0];
    expect(within(p1).getByRole('heading').textContent).toBe('地點');
    expect(p1.textContent).toContain('「江州」不在目前的篩選結果中。');
  });

  it('MV-12 description panel: none / single / multiple characters', () => {
    const desc = () => side().querySelectorAll<HTMLElement>('.panel')[1];
    const { unmount: u1 } = setup();
    expect(within(desc()).getByRole('heading').textContent).toBe('目前篩選');
    expect(desc().textContent).toContain('只選一位角色時，會以虛線畫出他的行跡。');
    u1();
    const { unmount: u2 } = setup({ names: ['武松'] });
    expect(within(desc()).getByRole('heading').textContent).toBe('武松的行跡');
    expect(desc().textContent).toContain('紅色虛線依章回順序連接地點，數字為移動順序。');
    u2();
    setup({ names: ['武松', '宋江'] });
    expect(within(desc()).getByRole('heading').textContent).toBe('目前篩選');
    expect(desc().textContent).toContain('選了多位角色時只標出地點，不畫行跡線。只選一位角色可看行跡。');
  });

  it('MV-13 (AC-P13 on map) zero results: EmptyState overlay on the map box, clear calls onClearFilters', async () => {
    const empty: StoryEvent[] = [];
    const props: MapViewProps = {
      scope: 'all',
      onScopeChange: vi.fn(),
      markers: [],
      trail: null,
      focusPlaceId: null,
      onSelectPlace: vi.fn(),
      unlocated: 0,
      events: empty,
      range: [1, 120],
      arcName: null,
      focusPlaceName: null,
      focusEvents: [],
      trailOwnerName: null,
      selectedCount: 2,
      onOpenEvent: vi.fn(),
      onClearFilters: vi.fn(),
    };
    render(<MapView {...props} />);
    const overlay = mapBox().querySelector('.empty-overlay') as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(within(overlay).getByRole('heading').textContent).toBe('沒有符合條件的事件');
    await userEvent.setup().click(within(overlay).getByRole('button', { name: '清除篩選' }));
    expect(props.onClearFilters).toHaveBeenCalledTimes(1);
  });
});
