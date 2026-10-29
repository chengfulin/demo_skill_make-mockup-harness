/**
 * S6 關係圖（展示元件；contracts/ui-contracts.md「S6 關係圖」；plan「關係圖（S6，FR-019）」）。
 * `section[data-page="S6 關係圖"]` > `.graphbox[data-testid=graph]`：
 *   ① 圖面 `.graphcanvas`（`GraphSvg`；全部淡出時 `EmptyState overlay` 覆蓋圖面，G-9、AC-S20）② `GraphLegend`。
 * 節點位移過場與 `prefers-reduced-motion` 關閉見 GraphView.css。
 */
import type { GraphLayout } from '../../domain/graphLayout';
import type { RelationType } from '../../domain/types';
import { EmptyState } from '../EmptyState/EmptyState';
import { GraphLegend } from './GraphLegend';
import { GraphSvg } from './GraphSvg';
import './GraphView.css';

export interface GraphViewProps {
  /** `graphLayout.layoutGraph` 結果 */
  layout: GraphLayout;
  /** `graphLayout.legendTypes` */
  legendTypes: readonly RelationType[];
  /** `graphLayout.legendCaption`（D-4） */
  caption: string;
  /** 點節點（AC-P32） */
  onOpenCharacter: (id: string) => void;
  /** 點節點「＋」（AC-P31） */
  onAddCharacter: (id: string) => void;
  /** 空狀態「清除篩選」 */
  onClearFilters: () => void;
}

export function GraphView({
  layout,
  legendTypes,
  caption,
  onOpenCharacter,
  onAddCharacter,
  onClearFilters,
}: GraphViewProps) {
  return (
    <section className="view graph-view" data-page="S6 關係圖">
      <div className="graphbox" data-testid="graph">
        <div className="graphcanvas">
          <GraphSvg layout={layout} onOpenCharacter={onOpenCharacter} onAddCharacter={onAddCharacter} />
          {layout.allDimmed && <EmptyState overlay onClear={onClearFilters} />}
        </div>
        <GraphLegend types={legendTypes} caption={caption} />
      </div>
    </section>
  );
}
