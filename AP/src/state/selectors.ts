/**
 * 衍生資料 selector（plan「狀態」：篩選結果不存 state，由 selector 即時算出）。
 * 只在 DatasetProvider 為 ready 時有資料；loading／error 時回傳空結果（App 此時不渲染視圖）。
 */
import { useMemo } from 'react';
import { useDataset } from '../data/DatasetProvider';
import { filterEvents } from '../domain/filter';
import type { StoryEvent } from '../domain/types';
import { useAppState } from './AppStateProvider';

const NO_EVENTS: readonly StoryEvent[] = [];

/** 目前篩選（已選角色 × 大節）下的事件，依全書順序。 */
export function useFilteredEvents(): readonly StoryEvent[] {
  const { dataset } = useDataset();
  const { selected, arcId } = useAppState();
  return useMemo(
    () => (dataset === null ? NO_EVENTS : filterEvents(dataset.events, selected, arcId)),
    [dataset, selected, arcId],
  );
}

/** 篩選結果數（「共 N 個事件」）。 */
export function useResultCount(): number {
  return useFilteredEvents().length;
}
