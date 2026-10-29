/**
 * S5 地圖（展示元件；contracts/ui-contracts.md「S5 地圖」；plan「地圖（S5，FR-015～FR-018）」）。
 * `section[data-page="S5 地圖"]` > `.mapgrid`：
 *   地圖欄 `.mapcol`：① `ScopeSwitch` ② 地圖框 `.mapbox[data-testid=map]`（`MapSvg`＋左下角註記＋右上無法定位提示
 *   ＋結果為 0 時 `EmptyState overlay`）③ `MapRuler`（與地圖同寬）
 *   側欄 `MapSidePanel`（`data-testid="map-side"`）。
 * 寬 ≥900px 為「地圖欄｜側欄 280px」兩欄，以下單欄（MapView.css）；SVG 寬 100% 自動縮放。
 */
import { EmptyState } from '../EmptyState/EmptyState';
import type { MapMarker, MapScopeId, TrailGeometry } from '../../domain/mapLayout';
import type { ChapterRange, StoryEvent } from '../../domain/types';
import { MapRuler } from './MapRuler';
import { MapSidePanel } from './MapSidePanel';
import { MapSvg } from './MapSvg';
import { ScopeSwitch } from './ScopeSwitch';
import './MapView.css';

export interface MapViewProps {
  scope: MapScopeId;
  /** 範圍分頁與全圖上的山東框（AC-P36） */
  onScopeChange: (scope: MapScopeId) => void;
  /** `mapLayout.buildMarkers` 結果 */
  markers: readonly MapMarker[];
  /** `mapLayout.projectTrail` 結果；只選一位角色時才給 */
  trail: TrailGeometry | null;
  focusPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  /** `mapLayout.unlocatedCount` */
  unlocated: number;
  /** 篩選結果（全書順序） */
  events: readonly StoryEvent[];
  /** 刻度範圍（未選大節為 1–120） */
  range: ChapterRange;
  arcName: string | null;
  focusPlaceName: string | null;
  focusEvents: readonly StoryEvent[];
  trailOwnerName: string | null;
  selectedCount: number;
  onOpenEvent: (eventId: string) => void;
  /** 空狀態「清除篩選」 */
  onClearFilters: () => void;
}

export function MapView({
  scope,
  onScopeChange,
  markers,
  trail,
  focusPlaceId,
  onSelectPlace,
  unlocated,
  events,
  range,
  arcName,
  focusPlaceName,
  focusEvents,
  trailOwnerName,
  selectedCount,
  onOpenEvent,
  onClearFilters,
}: MapViewProps) {
  return (
    <section className="view map-view" data-page="S5 地圖">
      <div className="mapgrid">
        <div className="mapcol">
          <ScopeSwitch value={scope} onChange={onScopeChange} />
          <div className="mapbox" data-testid="map">
            <MapSvg
              scope={scope}
              markers={markers}
              trail={trail}
              focusPlaceId={focusPlaceId}
              onSelectPlace={onSelectPlace}
              onZoomShandong={() => onScopeChange('sd')}
            />
            <span className="mapnote">
              {scope === 'sd' ? '示意，非精確測繪 · 山東範圍外的地點不顯示' : '示意，非精確測繪'}
            </span>
            {unlocated > 0 && <span className="unloc">{unlocated} 個事件無法標示地點</span>}
            {events.length === 0 && <EmptyState overlay onClear={onClearFilters} />}
          </div>
          <MapRuler range={range} arcName={arcName} events={events} />
        </div>
        <MapSidePanel
          focusPlaceName={focusPlaceName}
          focusEvents={focusEvents}
          trailOwnerName={trailOwnerName}
          selectedCount={selectedCount}
          onOpenEvent={onOpenEvent}
        />
      </div>
    </section>
  );
}
