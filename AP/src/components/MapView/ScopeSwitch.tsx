/**
 * 地圖範圍切換（S5 地圖欄 ①；Prototype `.maptools > .tabs[role=tablist][aria-label=地圖範圍]`）。
 * 「全圖」「山東」，預設全圖（AC-P35）；點擊一律回呼該範圍（冪等由 reducer 處理）。
 */
import { MAP_SCOPES, type MapScopeId } from '../../domain/mapLayout';

const SCOPES: readonly MapScopeId[] = ['all', 'sd'];

export interface ScopeSwitchProps {
  value: MapScopeId;
  onChange: (scope: MapScopeId) => void;
}

export function ScopeSwitch({ value, onChange }: ScopeSwitchProps) {
  return (
    <div className="maptools">
      <div className="tabs" role="tablist" aria-label="地圖範圍">
        {SCOPES.map((scope) => (
          <button
            key={scope}
            type="button"
            role="tab"
            data-scope-btn={scope}
            aria-selected={scope === value}
            onClick={() => onChange(scope)}
          >
            {MAP_SCOPES[scope].label}
          </button>
        ))}
      </div>
    </div>
  );
}
