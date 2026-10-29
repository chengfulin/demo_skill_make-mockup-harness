/**
 * S6 關係圖容器（T136；plan「關係圖（S6，FR-019）」、contracts/ui-contracts.md「S6 關係圖」）。
 * 以 `selected` 與大節（已選時 `charactersInArc(dataset.events, arcId)`，D-1、G-9）呼叫 `graphLayout.layoutGraph`；
 * 圖例類型 `legendTypes(dataset.relations)`、說明 `legendCaption(selected.length > 0)`（D-4）。
 * dispatch：點節點 `openCharacter`（AC-P32）、「＋」`addCharacter`（AC-P31）、空狀態「清除篩選」`clearFilters`。
 */
import { useCallback, useMemo } from 'react';
import { GraphView } from '../components/GraphView/GraphView';
import { useDataset } from '../data/DatasetProvider';
import { charactersInArc } from '../domain/filter';
import { layoutGraph, legendCaption, legendTypes } from '../domain/graphLayout';
import { useAppDispatch, useAppState } from '../state/AppStateProvider';

export function GraphContainer() {
  const { dataset } = useDataset();
  const { selected, arcId } = useAppState();
  const dispatch = useAppDispatch();

  const arcCharacters = useMemo(
    () => (dataset === null || arcId === null ? null : charactersInArc(dataset.events, arcId)),
    [dataset, arcId],
  );
  const layout = useMemo(
    () => (dataset === null ? null : layoutGraph(dataset, selected, arcCharacters)),
    [dataset, selected, arcCharacters],
  );
  const types = useMemo(() => (dataset === null ? [] : legendTypes(dataset.relations)), [dataset]);

  const onOpenCharacter = useCallback((id: string) => dispatch({ type: 'openCharacter', id }), [dispatch]);
  const onAddCharacter = useCallback((id: string) => dispatch({ type: 'addCharacter', id }), [dispatch]);
  const onClearFilters = useCallback(() => dispatch({ type: 'clearFilters' }), [dispatch]);

  if (layout === null) return null;
  return (
    <GraphView
      layout={layout}
      legendTypes={types}
      caption={legendCaption(selected.length > 0)}
      onOpenCharacter={onOpenCharacter}
      onAddCharacter={onAddCharacter}
      onClearFilters={onClearFilters}
    />
  );
}
