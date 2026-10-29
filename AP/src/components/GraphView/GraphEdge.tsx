/**
 * 關係圖連線（S6；Prototype `g.edge > line.e-<類型> > title`）。
 * 樣式依關係類型（research「關係線樣式」，GraphView.css 的 `.e-<slug>`）；`<title>`「<甲>—<乙>：<類型>。<說明>」。
 * 淡出：`.dim`（透明度 .12）。
 */
import type { GraphEdgeLayout } from '../../domain/graphLayout';
import type { RelationType } from '../../domain/types';

/** 關係類型 → CSS class 後綴（對應 token --r-*） */
export const RELATION_CLASS: Record<RelationType, string> = {
  結義: 'jie',
  主僕: 'zhu',
  兄弟: 'xd',
  夫妻: 'fq',
  仇敵: 'ch',
  師徒: 'mentor',
};

export interface GraphEdgeProps {
  edge: GraphEdgeLayout;
}

export function GraphEdge({ edge }: GraphEdgeProps) {
  const { index, aName, bName, type, note, x1, y1, x2, y2, dim } = edge;
  return (
    <g className={dim ? 'edge dim' : 'edge'} data-edge={index}>
      <line className={`e-${RELATION_CLASS[type]}`} data-type={type} x1={x1} y1={y1} x2={x2} y2={y2}>
        <title>{`${aName}—${bName}：${type}。${note}`}</title>
      </line>
    </g>
  );
}
