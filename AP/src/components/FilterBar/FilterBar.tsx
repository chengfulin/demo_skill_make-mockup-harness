/**
 * S1 角色篩選列（展示元件殼）。三視圖常駐於頁面上方（FR-005、AC-S13）。
 * 依據：contracts/ui-contracts.md S1 區塊順序：row → chars → sel → bar。
 * row／chars／sel 為插槽，內容由 US2（搜尋、角色清單、已選列）與 US3（大節選單）填入；
 * bar 固定為 ResultCount → ViewTabs。
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
