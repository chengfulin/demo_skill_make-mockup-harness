/**
 * S1 角色篩選列（展示元件殼）。三視圖常駐於頁面上方（FR-005、AC-S13）。
 * 依據：contracts/ui-contracts.md S1 區塊順序：row → chars → sel → bar。
 * row／chars／sel 為插槽，由容器組合：row 依序 SearchBox → GroupToggle「天罡」→「地煞」（US2）→ ArcSelect（US3）；
 * chars 放 CharacterList、sel 放 SelectedTags（US2）。bar 固定為 ResultCount → ViewTabs。
 * 樣式（chip `.on`、`.tog[aria-pressed]`、`.search`、`.tag`、`.empty-note`；≤720px chip 列單列橫捲）見 FilterBar.css。
 */
import type { ReactNode } from 'react';
import { ResultCount } from './ResultCount';
import { ViewTabs, type View } from './ViewTabs';
import './FilterBar.css';

export interface FilterBarProps {
  row?: ReactNode;
  chars?: ReactNode;
  sel?: ReactNode;
  resultCount: number;
  view: View;
  onViewChange: (view: View) => void;
}

export function FilterBar({ row, chars, sel, resultCount, view, onViewChange }: FilterBarProps) {
  return (
    <section className="filter" data-page="S1 角色篩選列">
      <div className="wrap">
        <div className="row">{row}</div>
        <div className="chars" data-testid="char-list">
          {chars}
        </div>
        <div className="sel" data-testid="selected-bar">
          {sel}
        </div>
        <div className="bar">
          <ResultCount count={resultCount} />
          <ViewTabs value={view} onChange={onViewChange} />
        </div>
      </div>
    </section>
  );
}
