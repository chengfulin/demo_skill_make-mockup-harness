/**
 * 關係圖 SVG（S6；Prototype `#graph svg`）：viewBox 820×720、`role="img"`、`aria-label`「角色關係圖」；
 * 邊（`g.edges`）在下、節點（`g.nodes`）在上。寬 100% 依 viewBox 自動縮放（GraphView.css）。
 */
import { GH, GW, type GraphLayout } from '../../domain/graphLayout';
import { GraphEdge } from './GraphEdge';
import { GraphNode } from './GraphNode';

export interface GraphSvgProps {
  layout: GraphLayout;
  onOpenCharacter: (id: string) => void;
  onAddCharacter: (id: string) => void;
}

export function GraphSvg({ layout, onOpenCharacter, onAddCharacter }: GraphSvgProps) {
  return (
    <svg viewBox={`0 0 ${GW} ${GH}`} role="img" aria-label="角色關係圖">
      <g className="edges">
        {layout.edges.map((e) => (
          <GraphEdge key={e.index} edge={e} />
        ))}
      </g>
      <g className="nodes">
        {layout.nodes.map((n) => (
          <GraphNode key={n.id} node={n} onOpen={onOpenCharacter} onAdd={onAddCharacter} />
        ))}
      </g>
    </svg>
  );
}
