/**
 * S4 角色資料面板容器（T110；contracts/ui-contracts.md「S4」；FR-013、FR-014、G-10(c)、AC-S24）。
 * `drawer.kind === 'character'` 時以 `Drawer`（data-page「S4 角色資料面板」、aria-label「角色資料」、
 * data-testid「character-drawer」、類別字「角色資料」；Escape／遮罩／關閉鈕關閉、≤720px 底部抽屜皆由 Drawer 提供）
 * 包 `CharacterDetail`：參與事件取 `eventsByCharacter`（全書順序）；關係取 `dataset.relations` 中含該角色者並換成另一端
 * （依資料順序）。「只看此角色」dispatch `onlyCharacter`（reducer 關閉面板）；事件 dispatch `openEvent`；
 * 關係對象 dispatch `openCharacter`。
 */
import { useCallback, useMemo } from 'react';
import { CharacterDetail } from '../components/CharacterDetail/CharacterDetail';
import type { RelatedCharacter } from '../components/CharacterDetail/CharacterRelations';
import { Drawer } from '../components/Drawer/Drawer';
import { useDataset } from '../data/DatasetProvider';
import type { StoryEvent } from '../domain/types';
import { useAppDispatch, useAppState } from '../state/AppStateProvider';

const NO_EVENTS: readonly StoryEvent[] = [];

export function CharacterDrawerContainer() {
  const { dataset } = useDataset();
  const { drawer } = useAppState();
  const dispatch = useAppDispatch();
  const characterId = drawer?.kind === 'character' ? drawer.id : null;

  const relations = useMemo<RelatedCharacter[]>(() => {
    if (dataset === null || characterId === null) return [];
    const out: RelatedCharacter[] = [];
    for (const r of dataset.relations) {
      if (r.a !== characterId && r.b !== characterId) continue;
      const other = dataset.characterById.get(r.a === characterId ? r.b : r.a);
      if (other) out.push({ character: other, type: r.type, note: r.note });
    }
    return out;
  }, [dataset, characterId]);

  const onClose = useCallback(() => dispatch({ type: 'closeDrawer' }), [dispatch]);
  const onOnlyCharacter = useCallback((id: string) => dispatch({ type: 'onlyCharacter', id }), [dispatch]);
  const onOpenEvent = useCallback((id: string) => dispatch({ type: 'openEvent', id }), [dispatch]);
  const onOpenCharacter = useCallback((id: string) => dispatch({ type: 'openCharacter', id }), [dispatch]);

  if (dataset === null || characterId === null) return null;
  const character = dataset.characterById.get(characterId);
  if (!character) return null;

  return (
    <Drawer page="S4 角色資料面板" label="角色資料" testId="character-drawer" kicker="角色資料" onClose={onClose}>
      <CharacterDetail
        character={character}
        events={dataset.eventsByCharacter.get(character.id) ?? NO_EVENTS}
        relations={relations}
        onOnlyCharacter={onOnlyCharacter}
        onOpenEvent={onOpenEvent}
        onOpenCharacter={onOpenCharacter}
      />
    </Drawer>
  );
}
