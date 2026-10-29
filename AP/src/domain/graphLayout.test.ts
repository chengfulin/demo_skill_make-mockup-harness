/**
 * 關係圖版面 graphLayout（T129，US7；測試先行，T132 實作後轉綠）
 *
 * 依據：plan「關係圖（S6，FR-019）」、research「版面常數」、Prototype `layout()`／`renderGraph()`；
 *       spec FR-019、D-1、D-4、G-9；AC-17、AC-18、AC-P29、AC-P30、AC-P40、AC-S18、AC-S20、AC-S22。
 *
 * 介面（T132 依此實作）：
 *   常數 GW=820、GH=720、GCX=410、GCY=360、RING1_R=175、RING1_MULTI_R=220、RING2_R=315、
 *        NODE_R=22、PLUS_R=9、DIM_OPACITY=0.12、DEFAULT_CENTER='songjiang'、RING_ORDER（Prototype 22 人環序）
 *   ringOrder(characters) → id[]：RING_ORDER 中資料有的角色（依環序），再把環序沒有的依資料順序補在最後
 *   layoutGraph(dataset, selected, arcCharacters: ReadonlySet<string> | null) → GraphLayout
 *     { centers: id[]; allDimmed: boolean;
 *       nodes: { id, name, avatar, group, x, y, ring: 0 | 1 | 2, selected, dim }[]   // 依 dataset.characters 順序
 *       edges: { index, a, b, aName, bName, type, note, x1, y1, x2, y2, dim }[] }    // 依 dataset.relations 順序
 *     中心＝已選（依加入順序；未選為宋江）；一層＝與任一中心有關係者；其餘為二層。
 *     單一中心放 (GCX, GCY)；多中心排半徑 min(40+12n, 130) 小圈（自 −90° 起）；
 *     一層半徑 175（多中心 220）自 −90°+0.2 rad 起，二層 315 自 −90° 起；第 i 個角度 = 起始 + i/n·2π。
 *     淡出：已選角色時非中心且非一層者淡出；arcCharacters 非 null 時再淡出不在其中者（含已選本人，G-9）。
 *     邊清楚 ⇔ 兩端都清楚 且（未選角色 或 一端為中心）。allDimmed ⇔ 全部節點淡出。
 *   legendTypes(relations) → 資料出現的關係類型，依首次出現順序
 *   legendCaption(hasSelected) → D-4 說明文字
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：真實資料、未選角色、未選大節
 *
 * | 特徵                 | blocks（非 base 者各為一案）                                       | 對應案例        |
 * | :------------------- | :----------------------------------------------------------------- | :-------------- |
 * | K1 常數              | 版面常數（viewBox、半徑、透明度）                                  | GL-K1           |
 * | O1 環序              | 真實資料（22 人＝環序）／資料多出環序沒有者／環序有、資料沒有者    | GL-O1～O3       |
 * | C1 中心              | 未選→宋江（base）／選 1 位（林沖）／選 2 位（林沖＋武松）          | GL-C1～C3       |
 * | R1 一層半徑與起始角  | 單中心 175、−90°+0.2（base）／多中心 220                           | GL-R1、GL-R2    |
 * | R2 二層              | 半徑 315、自 −90° 起                                               | GL-R3           |
 * | D1 角色淡出          | 未選 0 個（base）／選林沖 19 個（清楚＝林沖、魯智深、高俅）        | GL-D1、GL-D2    |
 * | D2 大節淡出（G-9）   | 無大節（base）／三打祝家莊未選角色／誤走妖魔＋王英全部淡出         | GL-D3、GL-D4    |
 * | E1 邊清楚            | 未選全部清楚（base）／選林沖只連到中心者／大節淡出端點的邊淡出     | GL-E1～E3       |
 * | L1 圖例類型          | 真實資料 5 種、首次出現順序、無師徒                                | GL-L1           |
 * | L2 圖例說明（D-4）   | 未選全句（base）／已選前半句                                       | GL-L2           |
 *
 * 範圍外（一次性宣告）：節點動畫（CSS transition，元件／E2E 驗）；選取不存在的角色 id（state 只存資料內 id）。
 */
import { describe, expect, it } from 'vitest';
import { charactersInArc } from './filter';
import {
  DEFAULT_CENTER,
  DIM_OPACITY,
  GCX,
  GCY,
  GH,
  GW,
  NODE_R,
  PLUS_R,
  RING1_MULTI_R,
  RING1_R,
  RING2_R,
  RING_ORDER,
  layoutGraph,
  legendCaption,
  legendTypes,
  ringOrder,
  type GraphLayout,
} from './graphLayout';
import type { Character } from './types';
import { arcIdOf, idOf, realDataset } from '../test-utils/realDataset';

const ds = realDataset;
const near = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);
const node = (l: GraphLayout, name: string) => {
  const n = l.nodes.find((x) => x.id === idOf(name));
  if (!n) throw new Error(`layout 沒有節點：${name}`);
  return n;
};
const dist = (x: number, y: number, cx = GCX, cy = GCY) => Math.hypot(x - cx, y - cy);
const angle = (x: number, y: number, cx = GCX, cy = GCY) => Math.atan2(y - cy, x - cx);
const clearNames = (l: GraphLayout) => l.nodes.filter((n) => !n.dim).map((n) => n.name).sort();

describe('graphLayout constants', () => {
  it('GL-K1 viewBox 820x720 centered at (410,360); radii and dim opacity follow research', () => {
    expect([GW, GH, GCX, GCY]).toEqual([820, 720, 410, 360]);
    expect([RING1_R, RING1_MULTI_R, RING2_R]).toEqual([175, 220, 315]);
    expect([NODE_R, PLUS_R]).toEqual([22, 9]);
    expect(DIM_OPACITY).toBe(0.12);
    expect(DEFAULT_CENTER).toBe('songjiang');
  });
});

describe('ringOrder', () => {
  it('GL-O1 real data: the 22 characters follow the fixed ring order', () => {
    expect(RING_ORDER).toHaveLength(22);
    expect(ringOrder(ds.characters)).toEqual(RING_ORDER);
  });

  it('GL-O2 characters missing from the ring order are appended in data order', () => {
    const extra = (id: string): Character => ({ ...ds.characters[0], id, name: id });
    const chars = [extra('zzz'), ...ds.characters, extra('aaa')];
    expect(ringOrder(chars)).toEqual([...RING_ORDER, 'zzz', 'aaa']);
  });

  it('GL-O3 ring-order ids absent from the data are dropped', () => {
    const chars = ds.characters.filter((c) => c.id !== 'gaoqiu');
    expect(ringOrder(chars)).toEqual(RING_ORDER.filter((id) => id !== 'gaoqiu'));
  });
});

describe('layoutGraph centers and rings', () => {
  it('GL-C1 nothing selected: 宋江 sits at the center; 22 nodes in data order; first ring = his relations', () => {
    const l = layoutGraph(ds, [], null);
    expect(l.centers).toEqual(['songjiang']);
    expect(l.nodes.map((n) => n.id)).toEqual(ds.characters.map((c) => c.id));
    const sj = node(l, '宋江');
    expect([sj.x, sj.y, sj.ring]).toEqual([GCX, GCY, 0]);
    expect(sj.selected).toBe(false);
    const ring1 = l.nodes.filter((n) => n.ring === 1).map((n) => n.name).sort();
    expect(ring1).toEqual(['高俅', '武松', '李逵', '花榮', '晁蓋'].sort());
  });

  it('GL-R1 single center: first ring radius 175 starting at -90deg+0.2rad in ring order', () => {
    const l = layoutGraph(ds, [], null);
    const ring1 = RING_ORDER.map((id) => l.nodes.find((n) => n.id === id)!).filter((n) => n.ring === 1);
    expect(ring1.map((n) => n.id)).toEqual(['gaoqiu', 'wusong', 'likui', 'huarong', 'chaogai']);
    ring1.forEach((n, i) => {
      near(dist(n.x, n.y), 175);
      const a = -Math.PI / 2 + 0.2 + (i / ring1.length) * Math.PI * 2;
      near(n.x, GCX + 175 * Math.cos(a));
      near(n.y, GCY + 175 * Math.sin(a));
    });
  });

  it('GL-R3 second ring: radius 315 starting at -90deg, in ring order', () => {
    const l = layoutGraph(ds, [], null);
    const ring2 = RING_ORDER.map((id) => l.nodes.find((n) => n.id === id)!).filter((n) => n.ring === 2);
    expect(ring2).toHaveLength(16);
    expect(ring2[0].id).toBe('yangzhi');
    near(ring2[0].x, GCX);
    near(ring2[0].y, GCY - 315);
    ring2.forEach((n, i) => {
      const a = -Math.PI / 2 + (i / ring2.length) * Math.PI * 2;
      near(n.x, GCX + 315 * Math.cos(a));
      near(n.y, GCY + 315 * Math.sin(a));
    });
  });

  it('GL-C2 one selected (林沖): 林沖 at center and marked selected; first ring = 魯智深, 高俅', () => {
    const l = layoutGraph(ds, [idOf('林沖')], null);
    expect(l.centers).toEqual([idOf('林沖')]);
    const lc = node(l, '林沖');
    expect([lc.x, lc.y, lc.ring, lc.selected]).toEqual([GCX, GCY, 0, true]);
    expect(l.nodes.filter((n) => n.ring === 1).map((n) => n.name).sort()).toEqual(['魯智深', '高俅'].sort());
    expect(node(l, '宋江').ring).toBe(2);
  });

  it('GL-C3/GL-R2 two selected: centers on a min(40+12n,130) circle, first ring radius 220', () => {
    const sel = [idOf('林沖'), idOf('武松')];
    const l = layoutGraph(ds, sel, null);
    expect(l.centers).toEqual(sel);
    const r0 = Math.min(40 + 12 * 2, 130);
    const lc = node(l, '林沖');
    near(lc.x, GCX);
    near(lc.y, GCY - r0);
    near(angle(node(l, '武松').x, node(l, '武松').y), Math.PI / 2);
    near(dist(node(l, '武松').x, node(l, '武松').y), r0);
    const ring1 = l.nodes.filter((n) => n.ring === 1);
    expect(ring1.map((n) => n.name).sort()).toEqual(['宋江', '魯智深', '高俅'].sort());
    ring1.forEach((n) => near(dist(n.x, n.y), 220));
  });

  it('GL-C3b many selected: center circle radius caps at 130', () => {
    const sel = ds.characters.slice(0, 10).map((c) => c.id);
    const l = layoutGraph(ds, sel, null);
    sel.forEach((id) => {
      const n = l.nodes.find((x) => x.id === id)!;
      near(dist(n.x, n.y), 130);
    });
  });
});

describe('layoutGraph dimming', () => {
  it('GL-D1 nothing selected (AC-P29): no node dimmed, not allDimmed', () => {
    const l = layoutGraph(ds, [], null);
    expect(l.nodes.filter((n) => n.dim)).toHaveLength(0);
    expect(l.allDimmed).toBe(false);
  });

  it('GL-D2 林沖 selected (AC-18, AC-P30): 19 dimmed; clear = 林沖, 魯智深, 高俅', () => {
    const l = layoutGraph(ds, [idOf('林沖')], null);
    expect(l.nodes.filter((n) => n.dim)).toHaveLength(19);
    expect(clearNames(l)).toEqual(['林沖', '魯智深', '高俅'].sort());
  });

  it('GL-D3 arc 三打祝家莊, nothing selected (AC-S18): characters without events in the arc are dimmed', () => {
    const arcId = arcIdOf('三打祝家莊');
    const l = layoutGraph(ds, [], charactersInArc(ds.events, arcId));
    expect(clearNames(l)).toEqual(
      ['李逵', '楊雄', '石秀', '戴宗', '時遷', '宋江', '吳用', '林沖', '扈三娘', '王英'].sort(),
    );
    expect(l.nodes.filter((n) => n.dim)).toHaveLength(12);
    expect(l.allDimmed).toBe(false);
  });

  it('GL-D3b arc intersects the one-hop set: 林沖 + 三打祝家莊 keeps only 林沖 clear', () => {
    const l = layoutGraph(ds, [idOf('林沖')], charactersInArc(ds.events, arcIdOf('三打祝家莊')));
    expect(clearNames(l)).toEqual(['林沖']);
  });

  it('GL-D4 arc 誤走妖魔・魯智深與林沖 + 王英 (AC-S20): every node dimmed including 王英; allDimmed', () => {
    const l = layoutGraph(ds, [idOf('王英')], charactersInArc(ds.events, arcIdOf('誤走妖魔・魯智深與林沖')));
    expect(node(l, '王英').dim).toBe(true);
    expect(l.nodes.every((n) => n.dim)).toBe(true);
    expect(l.allDimmed).toBe(true);
  });
});

describe('layoutGraph edges', () => {
  it('GL-E1 nothing selected: every relation is an edge, clear, with names and endpoint coordinates', () => {
    const l = layoutGraph(ds, [], null);
    expect(l.edges).toHaveLength(ds.relations.length);
    expect(l.edges.every((e) => !e.dim)).toBe(true);
    const e = l.edges[0];
    expect([e.aName, e.bName, e.type]).toEqual(['林沖', '魯智深', '結義']);
    expect(e.note).toBe(ds.relations[0].note);
    const a = node(l, '林沖');
    const b = node(l, '魯智深');
    expect([e.x1, e.y1, e.x2, e.y2]).toEqual([a.x, a.y, b.x, b.y]);
  });

  it('GL-E2 林沖 selected: only edges touching the center are clear', () => {
    const l = layoutGraph(ds, [idOf('林沖')], null);
    const clear = l.edges.filter((e) => !e.dim).map((e) => `${e.aName}-${e.bName}`).sort();
    expect(clear).toEqual(['林沖-魯智深', '高俅-林沖'].sort());
  });

  it('GL-E3 arc dimming: edges with a dimmed endpoint are dimmed even when nothing is selected', () => {
    const l = layoutGraph(ds, [], charactersInArc(ds.events, arcIdOf('三打祝家莊')));
    const clear = l.edges.filter((e) => !e.dim).map((e) => `${e.aName}-${e.bName}`).sort();
    expect(clear).toEqual(['宋江-李逵', '楊雄-石秀', '扈三娘-王英'].sort());
  });
});

describe('legend', () => {
  it('GL-L1 legend types (AC-P40): types present in data, first-appearance order, no 師徒', () => {
    expect(legendTypes(ds.relations)).toEqual(['結義', '主僕', '兄弟', '夫妻', '仇敵']);
    expect(legendTypes(ds.relations)).not.toContain('師徒');
  });

  it('GL-L2 legend caption (D-4, AC-S22): full sentence when none selected, first half otherwise', () => {
    expect(legendCaption(false)).toBe('點人物看資料，點「＋」加入篩選；未選角色時以宋江為中心');
    expect(legendCaption(true)).toBe('點人物看資料，點「＋」加入篩選');
  });
});
