/**
 * S1 角色清單（Prototype `renderChars`）：填入 FilterBar 的 `chars` 插槽（`data-testid="char-list"`）。
 * `characters` 為已依搜尋篩過的清單（依 characters.json 順序，由容器以 `matchCharacters` 算出）；
 * 無結果時以「找不到符合的角色」取代整個清單（FR-009、AC-P8）。
 */
import type { Character } from '../../domain/types';
import { CharacterChip } from './CharacterChip';

export interface CharacterListProps {
  characters: readonly Character[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onInfo?: (id: string) => void;
}

export function CharacterList({ characters, selectedIds, onToggle, onInfo }: CharacterListProps) {
  if (characters.length === 0) {
    return <div className="empty-note">找不到符合的角色</div>;
  }
  return (
    <>
      {characters.map((c) => (
        <CharacterChip
          key={c.id}
          character={c}
          selected={selectedIds.has(c.id)}
          onToggle={onToggle}
          onInfo={onInfo}
        />
      ))}
    </>
  );
}
