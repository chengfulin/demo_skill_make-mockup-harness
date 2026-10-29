/**
 * 關係圖版面（T132；plan「關係圖（S6，FR-019）」、research「版面常數」；Prototype `layout()`／`renderGraph()`）。
 *
 * - 中心：已選角色（依加入順序；未選為宋江）；一層：與任一中心有關係者；其餘為二層。
 * - 座標：單一中心放正中；多中心排半徑 min(40+12n, 130) 小圈；一層半徑 175（多中心 220）自 −90°+0.2 rad 起；
 *   二層半徑 315 自 −90° 起；環內依固定環序（RING_ORDER，資料中有、環序沒有者依資料順序補在最後）。
 * - 淡出：已選角色時非中心且非一層者淡出；已選大節時再淡出在該大節沒有參與事件者（含已選本人，D-1、G-9）。
 * - 邊清楚 ⇔ 兩端都清楚 且（未選角色 或 一端為中心）；全部節點淡出時 `allDimmed`（呼叫端覆蓋空狀態）。
 */
import type { Character, CharacterGroup, Dataset, Relation, RelationType } from './types';

export const GW = 820;
export const GH = 720;
export const GCX = GW / 2;
export const GCY = GH / 2;
/** 一層半徑（單一中心） */
export const RING1_R = 175;
/** 一層半徑（多個中心） */
export const RING1_MULTI_R = 220;
/** 二層半徑 */
export const RING2_R = 315;
/** 節點圓半徑 */
export const NODE_R = 22;
/** 節點「＋」半徑 */
export const PLUS_R = 9;
/** 淡出透明度（CSS 使用同值） */
export const DIM_OPACITY = 0.12;
/** 未選角色時的中心 */
export const DEFAULT_CENTER = 'songjiang';

/** Prototype 固定環序 */
export const RING_ORDER: readonly string[] = [
  'gaoqiu', 'yangzhi', 'luzhishen', 'linchong', 'chaijin', 'wusong', 'likui', 'daizong', 'huarong', 'wangying',
  'husanniang', 'shiqian', 'yangxiong', 'shixiu', 'yanqing', 'lujunyi', 'ruanxiaoqi', 'ruanxiaoer', 'gongsunsheng',
  'wuyong', 'chaogai', 'songjiang',
];

export interface GraphNodeLayout {
  id: string;
  name: string;
  avatar: string;
  group: CharacterGroup;
  x: number;
  y: number;
  /** 0 中心、1 一層、2 二層 */
  ring: 0 | 1 | 2;
  selected: boolean;
  dim: boolean;
}

export interface GraphEdgeLayout {
  /** 關係在資料中的索引 */
  index: number;
  a: string;
  b: string;
  aName: string;
  bName: string;
  type: RelationType;
  note: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dim: boolean;
}

export interface GraphLayout {
  centers: string[];
  /** 依 dataset.characters 順序 */
  nodes: GraphNodeLayout[];
  /** 依 dataset.relations 順序 */
  edges: GraphEdgeLayout[];
  allDimmed: boolean;
}

/** 環序：RING_ORDER 中資料有的角色，再依資料順序補上環序沒有者。 */
export function ringOrder(characters: readonly Character[]): string[] {
  const ids = new Set(characters.map((c) => c.id));
  const known = new Set(RING_ORDER);
  return [...RING_ORDER.filter((id) => ids.has(id)), ...characters.map((c) => c.id).filter((id) => !known.has(id))];
}

type Point = [number, number];

function placeOnCircle(ids: readonly string[], r: number, offset: number, pos: Map<string, Point>): void {
  ids.forEach((id, i) => {
    const a = offset + (i / ids.length) * Math.PI * 2;
    pos.set(id, [GCX + r * Math.cos(a), GCY + r * Math.sin(a)]);
  });
}

/**
 * 計算關係圖版面。
 * @param selected 已選角色（依加入順序）
 * @param arcCharacters 已選大節時，在該大節參與事件的角色（`filter.charactersInArc`）；未選大節為 null
 */
export function layoutGraph(
  dataset: Pick<Dataset, 'characters' | 'relations' | 'neighbors'>,
  selected: readonly string[],
  arcCharacters: ReadonlySet<string> | null,
): GraphLayout {
  const ids = new Set(dataset.characters.map((c) => c.id));
  const chosen = selected.filter((id) => ids.has(id));
  const focus = chosen.length > 0;
  const centers = focus ? chosen : [DEFAULT_CENTER];
  const centerSet = new Set(centers);
  const order = ringOrder(dataset.characters);
  const ring1 = order.filter(
    (id) => !centerSet.has(id) && centers.some((c) => dataset.neighbors.get(c)?.has(id) ?? false),
  );
  const ring1Set = new Set(ring1);
  const ring2 = order.filter((id) => !centerSet.has(id) && !ring1Set.has(id));

  const pos = new Map<string, Point>();
  if (centers.length === 1) pos.set(centers[0], [GCX, GCY]);
  else placeOnCircle(centers, Math.min(40 + centers.length * 12, 130), -Math.PI / 2, pos);
  placeOnCircle(ring1, centers.length > 1 ? RING1_MULTI_R : RING1_R, -Math.PI / 2 + 0.2, pos);
  placeOnCircle(ring2, RING2_R, -Math.PI / 2, pos);

  const selectedSet = new Set(chosen);
  const visible = (id: string): boolean =>
    (!focus || centerSet.has(id) || ring1Set.has(id)) && (arcCharacters === null || arcCharacters.has(id));

  const nodes: GraphNodeLayout[] = dataset.characters.map((c) => {
    const [x, y] = pos.get(c.id) ?? [GCX, GCY];
    return {
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      group: c.group,
      x,
      y,
      ring: centerSet.has(c.id) ? 0 : ring1Set.has(c.id) ? 1 : 2,
      selected: selectedSet.has(c.id),
      dim: !visible(c.id),
    };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const edges: GraphEdgeLayout[] = dataset.relations.flatMap((r, index) => {
    const a = byId.get(r.a);
    const b = byId.get(r.b);
    if (!a || !b) return [];
    const clear = !a.dim && !b.dim && (!focus || centerSet.has(r.a) || centerSet.has(r.b));
    return [
      {
        index,
        a: r.a,
        b: r.b,
        aName: a.name,
        bName: b.name,
        type: r.type,
        note: r.note,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        dim: !clear,
      },
    ];
  });

  return { centers, nodes, edges, allDimmed: nodes.length > 0 && nodes.every((n) => n.dim) };
}

/** 圖例關係類型：資料中出現者，依首次出現順序（AC-P40）。 */
export function legendTypes(relations: readonly Relation[]): RelationType[] {
  return [...new Set(relations.map((r) => r.type))];
}

/** 圖例說明（D-4）：未選角色時加「；未選角色時以宋江為中心」。 */
export function legendCaption(hasSelected: boolean): string {
  return `點人物看資料，點「＋」加入篩選${hasSelected ? '' : '；未選角色時以宋江為中心'}`;
}
