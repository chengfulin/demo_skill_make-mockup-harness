/**
 * S2 時間軸容器（T055；plan「時間軸（S2）」、contracts/ui-contracts.md「S2」）。
 * 取篩選結果（`useFilteredEvents`）與資料，以全書 1–120 回呼叫 `timelineLayout`；點事件卡 dispatch `openEvent`。
 * `computeLayout` 以 useCallback 固定參照，只在事件或大節改變時換新，避免 Timeline 每次 render 重算版面。
 * US2（T074）：已選角色傳給事件卡（頭像排前加外框，AC-P5）；結果為 0 時以 `EmptyState` 填 `empty` 插槽，
 * 「清除篩選」dispatch `clearFilters`（AC-P13、AC-P14）。US3（大節區間、點色帶選大節）於此擴充。
 */
import { useCallback, useMemo } from 'react';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { Timeline } from '../components/Timeline/Timeline';
import { useDataset } from '../data/DatasetProvider';
import { timelineLayout } from '../domain/timelineLayout';
import type { Arc, ChapterRange } from '../domain/types';
import { useAppDispatch, useAppState } from '../state/AppStateProvider';
import { useFilteredEvents } from '../state/selectors';

/** 全書章回區間 */
const FULL_RANGE: ChapterRange = [1, 120];
const NO_ARCS: readonly Arc[] = [];

export function TimelineContainer() {
  const { dataset } = useDataset();
  const { selected } = useAppState();
  const dispatch = useAppDispatch();
  const events = useFilteredEvents();
  const arcs = dataset?.arcs ?? NO_ARCS;

  const computeLayout = useCallback(
    (availableWidth: number) => timelineLayout(events, arcs, FULL_RANGE, availableWidth),
    [events, arcs],
  );
  const onOpenEvent = useCallback((id: string) => dispatch({ type: 'openEvent', id }), [dispatch]);
  const onClearFilters = useCallback(() => dispatch({ type: 'clearFilters' }), [dispatch]);
  const selectedIds = useMemo(() => new Set(selected), [selected]);

  if (dataset === null) return null;
  return (
    <Timeline
      computeLayout={computeLayout}
      events={events}
      arcs={arcs}
      characterById={dataset.characterById}
      selectedIds={selectedIds}
      onOpenEvent={onOpenEvent}
      empty={<EmptyState onClear={onClearFilters} />}
    />
  );
}
