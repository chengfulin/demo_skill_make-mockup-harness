/**
 * GraphView（S6 關係圖）展示元件測試（T130，US7；測試先行，T133～T135 實作後轉綠）
 *
 * 依據：contracts/ui-contracts.md「S6 關係圖」區塊順序、元件對照、逐字文案與狀態；
 *       Prototype `renderGraph`（section[data-page] > .graphbox(#graph svg[g#edges, g#nodes] → .glegend)）；
 *       spec AC-17、AC-18、AC-P29～AC-P32、AC-P40、AC-S20、AC-S22、FR-019、D-4、G-9。
 *
 * 本測試同時定義 T133～T135 的 props 介面（展示元件只吃 props，plan「元件分層」）：
 *   - `GraphView`（./GraphView）：
 *       { layout: GraphLayout;                         // graphLayout.layoutGraph 結果（含 allDimmed）
 *         legendTypes: readonly RelationType[];        // graphLayout.legendTypes
 *         caption: string;                             // graphLayout.legendCaption
 *         onOpenCharacter: (id) => void;               // 點節點圓（AC-P32）
 *         onAddCharacter: (id) => void;                // 點「＋」（AC-P31）
 *         onClearFilters: () => void }                 // 全部淡出時空狀態「清除篩選」
 *   - 子元件：`GraphSvg`（`GraphEdge`、`GraphNode`）、`GraphLegend`
 *   - DOM：節點 `g.node[data-node]`（淡出 `data-dim="true"`、已選 `data-selected="true"`＋`.sel`）
 *     內 `circle.c[role=button][tabindex=0][aria-label="<姓名> 角色資料"]`、`text.ch`、`text.nm`、
 *     `g.plus[role=button][aria-label="將 <姓名> 加入篩選"]`；邊 `g.edge > line > title`
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：真實資料、未選角色、未選大節
 *
 * | 特徵                | blocks（非 base 者各為一案）                                   | 對應案例    |
 * | :------------------ | :------------------------------------------------------------- | :---------- |
 * | L1 區塊順序         | SVG（邊在下、節點在上）→ 圖例（base）                          | GV-1        |
 * | N1 節點             | 22 個、頭像字＋姓名、群組色（base）／已選（朱框、無「＋」）    | GV-2、GV-3  |
 * | D1 淡出             | 0 個（base）／選林沖 19 個                                     | GV-4        |
 * | E1 邊 title         | 「<甲>—<乙>：<類型>。<說明>」、類型樣式 class                  | GV-5        |
 * | G1 圖例             | 天罡 地煞 其他＋5 類型＋說明（base）／已選說明（D-4）          | GV-6、GV-7  |
 * | A1 節點操作         | 點圓／Enter／Space → onOpenCharacter；點「＋」→ onAddCharacter | GV-8、GV-9  |
 * | Z1 全部淡出         | 否（base）／是（EmptyState 覆蓋、清除篩選）                    | GV-10       |
 *
 * 範圍外（一次性宣告）：座標與淡出規則（graphLayout.test 驗）；CSS transition 與 reduced-motion、
 * SVG 實際縮放（jsdom 無版面；E2E 驗）。
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { charactersInArc } from '../../domain/filter';
import { layoutGraph, legendCaption, legendTypes } from '../../domain/graphLayout';
import { arcIdOf, idOf, realDataset } from '../../test-utils/realDataset';
import { GraphView, type GraphViewProps } from './GraphView';

const ds = realDataset;

function setup({ names = [] as string[], arc }: { names?: string[]; arc?: string } = {}) {
  const selected = names.map(idOf);
  const arcChars = arc ? charactersInArc(ds.events, arcIdOf(arc)) : null;
  const props: GraphViewProps = {
    layout: layoutGraph(ds, selected, arcChars),
    legendTypes: legendTypes(ds.relations),
    caption: legendCaption(selected.length > 0),
    onOpenCharacter: vi.fn(),
    onAddCharacter: vi.fn(),
    onClearFilters: vi.fn(),
  };
  const view = render(<GraphView {...props} />);
  return { ...view, props, user: userEvent.setup() };
}

const section = () => document.querySelector<HTMLElement>('section[data-page="S6 關係圖"]')!;
const graph = () => screen.getByTestId('graph');
const nodes = () => [...graph().querySelectorAll<SVGGElement>('g.node')];
const nodeOf = (name: string) => graph().querySelector<SVGGElement>(`g.node[data-node="${idOf(name)}"]`)!;
const circleOf = (name: string) =>
  graph().querySelector<SVGCircleElement>(`circle[role="button"][aria-label="${name} 角色資料"]`)!;
const plusOf = (name: string) => graph().querySelector<SVGGElement>(`[role="button"][aria-label="將 ${name} 加入篩選"]`);

describe('GraphView (S6)', () => {
  it('GV-1 block order: section > graph box > SVG (edges below nodes) then legend', () => {
    setup();
    expect(section()).toBeInTheDocument();
    expect(within(section()).getByTestId('graph')).toBe(graph());
    const svg = graph().querySelector('svg')!;
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-label', '角色關係圖');
    expect(svg).toHaveAttribute('viewBox', '0 0 820 720');
    const edgesG = svg.querySelector('g.edges')!;
    const nodesG = svg.querySelector('g.nodes')!;
    expect(edgesG.compareDocumentPosition(nodesG) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const legend = graph().querySelector('.glegend')!;
    expect(svg.compareDocumentPosition(legend) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('GV-2 (AC-17) 22 nodes with avatar char, name, group colour class, plus button', () => {
    setup();
    expect(nodes()).toHaveLength(22);
    const yz = nodeOf('楊志');
    expect(yz.querySelector('text.ch')!.textContent).toBe('志');
    expect(yz.querySelector('text.nm')!.textContent).toBe('楊志');
    expect(circleOf('楊志')).toHaveAttribute('tabindex', '0');
    expect(circleOf('宋江')).toHaveClass('tg');
    expect(circleOf('扈三娘')).toHaveClass('ds');
    expect(circleOf('高俅')).toHaveClass('ot');
    expect(plusOf('宋江')).not.toBeNull();
    expect(plusOf('宋江')!.textContent).toBe('＋');
    expect(nodeOf('宋江')).not.toHaveAttribute('data-selected');
  });

  it('GV-3 (AC-P31) selected node: seal outline class + data-selected, no plus button', () => {
    setup({ names: ['林沖'] });
    expect(nodeOf('林沖')).toHaveAttribute('data-selected', 'true');
    expect(nodeOf('林沖')).toHaveClass('sel');
    expect(plusOf('林沖')).toBeNull();
    expect(plusOf('高俅')).not.toBeNull();
  });

  it('GV-4 (AC-P29, AC-P30) dim count: 0 when none selected; 19 with 林沖', () => {
    setup();
    expect(graph().querySelectorAll('g.node[data-dim="true"]')).toHaveLength(0);
    setup({ names: ['林沖'] });
    const dims = [...document.querySelectorAll('[data-testid="graph"]')].at(-1)!.querySelectorAll(
      'g.node[data-dim="true"]',
    );
    expect(dims).toHaveLength(19);
  });

  it('GV-5 edge title "<a>—<b>：<type>。<note>" and type style class', () => {
    setup();
    const edges = graph().querySelectorAll('g.edge');
    expect(edges).toHaveLength(ds.relations.length);
    const r = ds.relations[0];
    const line = edges[0].querySelector('line')!;
    expect(line.querySelector('title')!.textContent).toBe(`林沖—魯智深：結義。${r.note}`);
    expect(line).toHaveAttribute('data-type', '結義');
    const enemy = [...edges].find((e) => e.querySelector('line')!.getAttribute('data-type') === '仇敵')!;
    expect(enemy.querySelector('line')).toHaveClass('e-ch');
  });

  it('GV-6 (AC-17, AC-P40, AC-S22) legend: 天罡 地煞 其他 + present types + full caption, no 師徒', () => {
    setup();
    const legend = graph().querySelector<HTMLElement>('.glegend')!;
    const items = [...legend.children].map((c) => c.textContent);
    expect(items).toEqual([
      '天罡',
      '地煞',
      '其他',
      '結義',
      '主僕',
      '兄弟',
      '夫妻',
      '仇敵',
      '點人物看資料，點「＋」加入篩選；未選角色時以宋江為中心',
    ]);
    expect(legend.textContent).not.toContain('師徒');
  });

  it('GV-7 (AC-S22) caption with a selection drops the second half', () => {
    setup({ names: ['林沖'] });
    const legend = graph().querySelector<HTMLElement>('.glegend')!;
    expect(legend.lastElementChild!.textContent).toBe('點人物看資料，點「＋」加入篩選');
  });

  it('GV-8 (AC-P32) click / Enter / Space on node circle opens character', async () => {
    const { props, user } = setup();
    await user.click(circleOf('宋江'));
    expect(props.onOpenCharacter).toHaveBeenLastCalledWith('songjiang');
    circleOf('魯智深').focus();
    await user.keyboard('{Enter}');
    expect(props.onOpenCharacter).toHaveBeenLastCalledWith('luzhishen');
    circleOf('林沖').focus();
    await user.keyboard(' ');
    expect(props.onOpenCharacter).toHaveBeenLastCalledWith('linchong');
    expect(props.onOpenCharacter).toHaveBeenCalledTimes(3);
    expect(props.onAddCharacter).not.toHaveBeenCalled();
  });

  it('GV-9 (AC-P31) plus adds to filter without opening the character; Enter works too', async () => {
    const { props, user } = setup({ names: ['林沖'] });
    await user.click(plusOf('高俅')!);
    expect(props.onAddCharacter).toHaveBeenLastCalledWith('gaoqiu');
    expect(props.onOpenCharacter).not.toHaveBeenCalled();
    plusOf('魯智深')!.focus();
    await user.keyboard('{Enter}');
    expect(props.onAddCharacter).toHaveBeenLastCalledWith('luzhishen');
    expect(props.onOpenCharacter).not.toHaveBeenCalled();
  });

  it('GV-10 (AC-S20) all dimmed: EmptyState overlay with 清除篩選', async () => {
    const { props, user } = setup({ names: ['王英'], arc: '誤走妖魔・魯智深與林沖' });
    expect(graph().querySelectorAll('g.node[data-dim="true"]')).toHaveLength(22);
    expect(within(graph()).getByRole('heading', { name: '沒有符合條件的事件' })).toBeInTheDocument();
    await user.click(within(graph()).getByRole('button', { name: '清除篩選' }));
    expect(props.onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('GV-10b not all dimmed: no EmptyState', () => {
    setup({ arc: '三打祝家莊' });
    expect(graph().querySelectorAll('g.node[data-dim="true"]')).toHaveLength(12);
    expect(within(graph()).queryByText('沒有符合條件的事件')).toBeNull();
  });
});
