/**
 * 視圖分頁（S1 結果列）：時間軸／地圖／關係圖。
 * 依據：contracts/ui-contracts.md S1「視圖分頁」；Prototype `.tabs[role=tablist]` > 3 個 `button[role=tab]`。
 * 點擊一律回呼該視圖（含目前視圖；冪等由 reducer 處理）。
 */
export type View = 'timeline' | 'map' | 'graph';

const TABS: ReadonlyArray<{ view: View; label: string }> = [
  { view: 'timeline', label: '時間軸' },
  { view: 'map', label: '地圖' },
  { view: 'graph', label: '關係圖' },
];

export interface ViewTabsProps {
  value: View;
  onChange: (view: View) => void;
}

export function ViewTabs({ value, onChange }: ViewTabsProps) {
  return (
    <div className="tabs" role="tablist">
      {TABS.map(({ view, label }) => (
        <button
          key={view}
          type="button"
          role="tab"
          id={`tab-${view}`}
          data-view={view}
          aria-selected={view === value}
          onClick={() => onChange(view)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
