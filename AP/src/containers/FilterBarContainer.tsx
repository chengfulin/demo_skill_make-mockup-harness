/**
 * S1 角色篩選列容器（T056；contracts/ui-contracts.md「S1」）。
 * 結果數取 `useResultCount`，視圖分頁 dispatch `setView`（hash 由 AppStateProvider 同步）。
 * row／chars／sel 插槽由 US2（搜尋、chip、已選列）、US3（大節選單）填入。
 */
import { useCallback } from 'react';
import { FilterBar } from '../components/FilterBar/FilterBar';
import type { View } from '../state/appReducer';
import { useAppDispatch, useAppState } from '../state/AppStateProvider';
import { useResultCount } from '../state/selectors';

export function FilterBarContainer() {
  const { view } = useAppState();
  const dispatch = useAppDispatch();
  const resultCount = useResultCount();
  const onViewChange = useCallback((next: View) => dispatch({ type: 'setView', view: next }), [dispatch]);

  return <FilterBar resultCount={resultCount} view={view} onViewChange={onViewChange} />;
}
