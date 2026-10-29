/**
 * S5 地圖容器（T126；plan「地圖（S5，FR-015～FR-018）」、contracts/ui-contracts.md「S5 地圖」）。
 * 取篩選結果（`useFilteredEvents`）、`mapScope`、`focusPlace`，以 `mapLayout.*` 組 `MapViewProps`：
 *   標記 `buildMarkers(篩選結果, placeById, 範圍)`；行跡只在 `selected.length === 1` 時計算
 *   （`projectTrail(buildTrail(...), placeById, 範圍)`，<2 點為 null，G-3）；
 *   側欄焦點事件 `eventsAtPlace(篩選結果, focusPlace)`（不受地圖範圍影響）；刻度範圍為大節章回或全書 1–120。
 * dispatch：範圍分頁／山東框 `setMapScope`、標記 `focusPlace`、側欄事件 `openEvent`、空狀態 `clearFilters`。
 */
import { useCallback, useMemo } from 'react';
import { MapView } from '../components/MapView/MapView';
import { useDataset } from '../data/DatasetProvider';
import {
  BOOK_RANGE,
  buildMarkers,
  buildTrail,
  eventsAtPlace,
  projectTrail,
  unlocatedCount,
  type MapScopeId,
} from '../domain/mapLayout';
import type { StoryEvent } from '../domain/types';
import { useAppDispatch, useAppState } from '../state/AppStateProvider';
import { useFilteredEvents } from '../state/selectors';

const NO_EVENTS: readonly StoryEvent[] = [];

export function MapContainer() {
  const { dataset } = useDataset();
  const { selected, arcId, mapScope, focusPlace } = useAppState();
  const dispatch = useAppDispatch();
  const filtered = useFilteredEvents();

  const markers = useMemo(
    () => (dataset === null ? [] : buildMarkers(filtered, dataset.placeById, mapScope)),
    [dataset, filtered, mapScope],
  );
  const trailOwnerId = selected.length === 1 ? selected[0] : null;
  const trail = useMemo(
    () =>
      dataset === null || trailOwnerId === null
        ? null
        : projectTrail(buildTrail(filtered, trailOwnerId), dataset.placeById, mapScope),
    [dataset, filtered, trailOwnerId, mapScope],
  );
  const focusEvents = useMemo(
    () => (focusPlace === null ? NO_EVENTS : eventsAtPlace(filtered, focusPlace)),
    [filtered, focusPlace],
  );

  const onScopeChange = useCallback((scope: MapScopeId) => dispatch({ type: 'setMapScope', scope }), [dispatch]);
  const onSelectPlace = useCallback((placeId: string) => dispatch({ type: 'focusPlace', placeId }), [dispatch]);
  const onOpenEvent = useCallback((id: string) => dispatch({ type: 'openEvent', id }), [dispatch]);
  const onClearFilters = useCallback(() => dispatch({ type: 'clearFilters' }), [dispatch]);

  if (dataset === null) return null;
  const arc = arcId === null ? undefined : dataset.arcById.get(arcId);
  const focusPlaceName = focusPlace === null ? null : (dataset.placeById.get(focusPlace)?.name ?? focusPlace);
  const trailOwnerName = trailOwnerId === null ? null : (dataset.characterById.get(trailOwnerId)?.name ?? null);

  return (
    <MapView
      scope={mapScope}
      onScopeChange={onScopeChange}
      markers={markers}
      trail={trail}
      focusPlaceId={focusPlace}
      onSelectPlace={onSelectPlace}
      unlocated={unlocatedCount(filtered)}
      events={filtered}
      range={arc?.chapters ?? BOOK_RANGE}
      arcName={arc?.name ?? null}
      focusPlaceName={focusPlaceName}
      focusEvents={focusEvents}
      trailOwnerName={trailOwnerName}
      selectedCount={selected.length}
      onOpenEvent={onOpenEvent}
      onClearFilters={onClearFilters}
    />
  );
}
