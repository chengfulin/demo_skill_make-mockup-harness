/**
 * FilterBar（S1 角色篩選列）殼與結果列元件測試（T042，US1）
 *
 * 依據：contracts/ui-contracts.md「S1 角色篩選列」區塊順序、元件對照、逐字文案與狀態；
 *       Prototype `[P S1-01]`（index.html：section.filter > .row → .chars → .sel → .bar
 *       > .count[aria-live=polite] → .tabs[role=tablist] > 3 個 role=tab）；
 *       spec FR-005、AC-S13（三視圖都渲染篩選列；本檔只驗展示元件結構，三視圖切換由 E2E 驗）。
 *
 * 本測試同時定義 T053 要實作的 props 介面（展示元件只吃 props，plan「元件分層」）：
 *   - `FilterBar`（./FilterBar）：
 *       { row?: ReactNode; chars?: ReactNode; sel?: ReactNode;      // US2／US3 填入的插槽
 *         resultCount: number; view: 'timeline'|'map'|'graph';
 *         onViewChange: (view) => void }
 *     bar 區塊內依序渲染 `ResultCount` → `ViewTabs`。
 *   - `ResultCount`（./ResultCount）：{ count: number }
 *   - `ViewTabs`（./ViewTabs）：{ value: 'timeline'|'map'|'graph'; onChange: (view) => void }
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：插槽皆未提供、resultCount=54、view='timeline'、不點擊
 *
 * | 特徵                    | blocks                                   | base       | 對應案例            |
 * | :---------------------- | :--------------------------------------- | :--------- | :------------------ |
 * | C1 插槽內容             | 皆未提供／皆提供（US2、US3 填入）        | 皆未提供   | FB-1、FB-2          |
 * | C2 結果數 N             | 54（未篩選）／一般值 8／0（無結果）      | 54         | RC-1、RC-2、RC-3    |
 * | C3 目前視圖             | timeline／map／graph                     | timeline   | VT-1、VT-2、VT-3    |
 * | C4 使用者操作（分頁）   | 不點擊／點擊非目前分頁／點擊目前分頁     | 不點擊     | VT-1、VT-4、VT-5    |
 *
 * 範圍外（主要流程外，一次性宣告）：N 為負數或非整數（由 selector 保證為篩選結果長度，不會發生）；
 * 未知的 view 值（由 useHashView 正規化為 timeline，T040 驗）；鍵盤方向鍵切換分頁（Prototype 無此行為）。
 * 數字與中文間的空白為視覺間距（contracts 前言），比對前移除空白。
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterBar } from './FilterBar';
import { ResultCount } from './ResultCount';
import { ViewTabs } from './ViewTabs';

type View = 'timeline' | 'map' | 'graph';

const S1 = 'S1 角色篩選列';
const TAB_LABELS = ['時間軸', '地圖', '關係圖'] as const;
const LABEL_OF: Record<View, string> = { timeline: '時間軸', map: '地圖', graph: '關係圖' };

/** 移除所有空白（含 NBSP），供「共 <N> 個事件」比對 */
const squash = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, '');

function renderFilterBar(overrides: Partial<Parameters<typeof FilterBar>[0]> = {}) {
  const onViewChange = vi.fn();
  const utils = render(
    <FilterBar resultCount={54} view="timeline" onViewChange={onViewChange} {...overrides} />,
  );
  const section = utils.container.querySelector<HTMLElement>(`section.filter[data-page="${S1}"]`);
  return { ...utils, section, onViewChange };
}

describe('FilterBar（S1 殼）', () => {
  // FB-1（base）：根元素與四個區塊順序 row → chars → sel → bar
  it('renders section.filter with data-page and four blocks in order', () => {
    const { section } = renderFilterBar();
    expect(section).not.toBeNull();
    expect(section!.tagName).toBe('SECTION');

    const charList = within(section!).getByTestId('char-list');
    const selectedBar = within(section!).getByTestId('selected-bar');
    const count = within(section!).getByTestId('result-count');
    const tablist = within(section!).getByRole('tablist');

    const row = section!.querySelector('.row');
    const bar = section!.querySelector('.bar');
    expect(row).not.toBeNull();
    expect(bar).not.toBeNull();
    expect(charList).toHaveClass('chars');
    expect(selectedBar).toHaveClass('sel');
    expect(bar).toContainElement(count);
    expect(bar).toContainElement(tablist);

    // 文件順序：row → chars → sel → bar
    const order = [row!, charList, selectedBar, bar!];
    for (let i = 0; i < order.length - 1; i += 1) {
      expect(
        order[i].compareDocumentPosition(order[i + 1]) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }

    // bar 內：結果數 → 視圖分頁
    expect(count.compareDocumentPosition(tablist) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // FB-1（base）：結果列顯示結果數與三個分頁，目前視圖為選取
  it('renders result count and view tabs inside bar', () => {
    const { section } = renderFilterBar();
    expect(squash(within(section!).getByTestId('result-count').textContent)).toBe('共54個事件');
    const tabs = within(section!).getAllByRole('tab');
    expect(tabs.map((t) => t.textContent?.trim())).toEqual([...TAB_LABELS]);
    expect(within(section!).getByRole('tab', { name: '時間軸' })).toHaveAttribute('aria-selected', 'true');
  });

  // FB-2（C1 變動）：插槽內容渲染在對應區塊內（US2／US3 填入）
  it('renders slot contents into row, chars and sel blocks', () => {
    const { section } = renderFilterBar({
      row: <span>row-slot</span>,
      chars: <span>chars-slot</span>,
      sel: <span>sel-slot</span>,
    });
    expect(section!.querySelector('.row')).toContainElement(screen.getByText('row-slot'));
    expect(within(section!).getByTestId('char-list')).toContainElement(screen.getByText('chars-slot'));
    expect(within(section!).getByTestId('selected-bar')).toContainElement(screen.getByText('sel-slot'));
  });

  // FB-3（C4 變動）：點分頁把視圖交給 onViewChange（容器再 dispatch setView）
  it('forwards tab clicks to onViewChange', async () => {
    const user = userEvent.setup();
    const { onViewChange } = renderFilterBar();
    await user.click(screen.getByRole('tab', { name: '關係圖' }));
    expect(onViewChange).toHaveBeenCalledTimes(1);
    expect(onViewChange).toHaveBeenCalledWith('graph');
  });
});

describe('ResultCount', () => {
  // RC-1（base）：未篩選 54
  it('shows "共 54 個事件" with aria-live polite', () => {
    render(<ResultCount count={54} />);
    const el = screen.getByTestId('result-count');
    expect(el).toHaveAttribute('aria-live', 'polite');
    expect(squash(el.textContent)).toBe('共54個事件');
  });

  // RC-2（C2 變動）：一般值（武松 8）
  it('shows the given count', () => {
    render(<ResultCount count={8} />);
    expect(squash(screen.getByTestId('result-count').textContent)).toBe('共8個事件');
  });

  // RC-3（C2 變動）：0（無結果時仍顯示，不隱藏）
  it('shows zero count', () => {
    render(<ResultCount count={0} />);
    expect(squash(screen.getByTestId('result-count').textContent)).toBe('共0個事件');
  });
});

describe('ViewTabs', () => {
  function renderTabs(value: View) {
    const onChange = vi.fn();
    render(<ViewTabs value={value} onChange={onChange} />);
    return { onChange };
  }

  // VT-1／VT-2／VT-3（C3 各 block）：tablist 內三個 tab，依序文字，只有目前視圖 aria-selected="true"
  it.each<View>(['timeline', 'map', 'graph'])('marks %s as the selected tab', (view) => {
    renderTabs(view);
    const tablist = screen.getByRole('tablist');
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs.map((t) => t.textContent?.trim())).toEqual([...TAB_LABELS]);
    for (const tab of tabs) {
      const selected = tab.textContent?.trim() === LABEL_OF[view];
      expect(tab).toHaveAttribute('aria-selected', String(selected));
    }
  });

  // 可點元素皆為 <button>（contracts 通用規則：鍵盤可操作）
  it('renders tabs as buttons', () => {
    renderTabs('timeline');
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.tagName).toBe('BUTTON');
    }
  });

  // VT-4（C4 變動）：點擊非目前分頁 → onChange(該視圖)
  it.each<[string, View]>([
    ['地圖', 'map'],
    ['關係圖', 'graph'],
  ])('calls onChange when clicking %s', async (label, view) => {
    const user = userEvent.setup();
    const { onChange } = renderTabs('timeline');
    await user.click(screen.getByRole('tab', { name: label }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(view);
  });

  // VT-5（C4 變動）：點擊目前分頁 → 仍回呼同一視圖（Prototype setView 不判斷是否相同；冪等由 reducer 處理）
  it('calls onChange with current view when clicking the selected tab', async () => {
    const user = userEvent.setup();
    const { onChange } = renderTabs('map');
    await user.click(screen.getByRole('tab', { name: '地圖' }));
    expect(onChange).toHaveBeenCalledWith('map');
  });

  // 鍵盤：Enter 觸發（<button> 原生行為）
  it('activates a tab with keyboard Enter', async () => {
    const user = userEvent.setup();
    const { onChange } = renderTabs('timeline');
    screen.getByRole('tab', { name: '地圖' }).focus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('map');
  });
});
