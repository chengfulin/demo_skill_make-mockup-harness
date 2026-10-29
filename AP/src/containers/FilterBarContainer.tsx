/**
 * S1 角色篩選列容器（T056、T073；contracts/ui-contracts.md「S1」）。
 * - row：SearchBox（即打即篩 `setQuery`；Enter 以 `enterSelectTarget` dispatch `submitSearch`，D-3）→ 天罡 → 地煞
 *   （成員自 dataset 依 `group` 算出，全選時 `aria-pressed`；`toggleGroup`，G-7）。
 * - arc（T082）：ArcSelect（`arcs` 依資料順序、值為目前 `arcId`；變更 dispatch `selectArc`，FR-011）。
 * - chars：CharacterList（`matchCharacters` 篩過、依 characters.json 順序；`toggleCharacter`）。
 * - sel：SelectedTags（依加入順序；`removeCharacter`、`clearCharacters`）。
 * - bar：結果數取 `useResultCount`，視圖分頁 dispatch `setView`（hash 由 AppStateProvider 同步）。
 */
import { useCallback, useMemo } from 'react';
import { ArcSelect } from '../components/FilterBar/ArcSelect';
import { CharacterList } from '../components/FilterBar/CharacterList';
import { FilterBar } from '../components/FilterBar/FilterBar';
import { GroupToggle, type ToggleGroup } from '../components/FilterBar/GroupToggle';
import { SearchBox } from '../components/FilterBar/SearchBox';
import { SelectedTags } from '../components/FilterBar/SelectedTags';
import { useDataset } from '../data/DatasetProvider';
import { enterSelectTarget, matchCharacters } from '../domain/search';
import type { Arc, Character } from '../domain/types';
import type { View } from '../state/appReducer';
import { useAppDispatch, useAppState } from '../state/AppStateProvider';
import { useResultCount } from '../state/selectors';

const NO_CHARACTERS: readonly Character[] = [];
const NO_ARCS: readonly Arc[] = [];
const GROUPS: readonly ToggleGroup[] = ['天罡', '地煞'];

export function FilterBarContainer() {
  const { view, selected, query, arcId } = useAppState();
  const dispatch = useAppDispatch();
  const resultCount = useResultCount();
  const { dataset } = useDataset();
  const characters = dataset?.characters ?? NO_CHARACTERS;
  const characterById = dataset?.characterById;
  const arcs = dataset?.arcs ?? NO_ARCS;

  const matches = useMemo(() => matchCharacters(characters, query), [characters, query]);
  const selectedIds = useMemo(() => new Set(selected), [selected]);
  const selectedCharacters = useMemo(
    () =>
      characterById
        ? selected.map((id) => characterById.get(id)).filter((c): c is Character => c !== undefined)
        : NO_CHARACTERS,
    [selected, characterById],
  );
  const groupMembers = useMemo(() => {
    const members = new Map<ToggleGroup, string[]>();
    for (const g of GROUPS) members.set(g, characters.filter((c) => c.group === g).map((c) => c.id));
    return members;
  }, [characters]);

  const onViewChange = useCallback((next: View) => dispatch({ type: 'setView', view: next }), [dispatch]);
  const onQueryChange = useCallback((q: string) => dispatch({ type: 'setQuery', query: q }), [dispatch]);
  const onSubmit = useCallback(
    () => dispatch({ type: 'submitSearch', id: enterSelectTarget(matches, selected) }),
    [dispatch, matches, selected],
  );
  const onToggle = useCallback((id: string) => dispatch({ type: 'toggleCharacter', id }), [dispatch]);
  const onRemove = useCallback((id: string) => dispatch({ type: 'removeCharacter', id }), [dispatch]);
  const onClear = useCallback(() => dispatch({ type: 'clearCharacters' }), [dispatch]);
  const onArcChange = useCallback((id: string | null) => dispatch({ type: 'selectArc', id }), [dispatch]);

  const row = (
    <>
      <SearchBox value={query} onChange={onQueryChange} onSubmit={onSubmit} />
      {GROUPS.map((g) => {
        const members = groupMembers.get(g) ?? [];
        const pressed = members.length > 0 && members.every((id) => selectedIds.has(id));
        return (
          <GroupToggle
            key={g}
            group={g}
            pressed={pressed}
            onToggle={() => dispatch({ type: 'toggleGroup', members })}
          />
        );
      })}
    </>
  );

  return (
    <FilterBar
      row={row}
      arc={<ArcSelect arcs={arcs} value={arcId} onChange={onArcChange} />}
      chars={<CharacterList characters={matches} selectedIds={selectedIds} onToggle={onToggle} />}
      sel={<SelectedTags characters={selectedCharacters} onRemove={onRemove} onClear={onClear} />}
      resultCount={resultCount}
      view={view}
      onViewChange={onViewChange}
    />
  );
}
