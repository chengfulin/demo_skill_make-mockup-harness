/**
 * S1 角色 chip（Prototype `.chip(.on)` > `button.pick[aria-pressed]`（`.av` ＋ `.nm` ＋ `.nk`）＋ `button.info`）。
 * 依據：contracts/ui-contracts.md「S1」chip、chip 資料鈕列；高俅無綽號只顯示姓名；
 * 資料鈕只在提供 `onInfo` 時渲染（US5），點擊不改變選取（AC-S12）。
 * E2E fixture 以 `.chip > button.pick[aria-pressed]` 與只放姓名的 `.nm` 定位，結構勿改。
 */
import type { Character } from '../../domain/types';
import { Avatar } from '../Avatar/Avatar';

export interface CharacterChipProps {
  character: Character;
  selected: boolean;
  onToggle: (id: string) => void;
  /** 開角色資料（US5）；未提供時不渲染「i」鈕 */
  onInfo?: (id: string) => void;
}

export function CharacterChip({ character, selected, onToggle, onInfo }: CharacterChipProps) {
  const nick = character.nicknames[0];
  return (
    <div className={selected ? 'chip on' : 'chip'}>
      <button type="button" className="pick" aria-pressed={selected} onClick={() => onToggle(character.id)}>
        <Avatar avatar={character.avatar} group={character.group} />
        <span className="nm">{character.name}</span>
        {nick ? <span className="nk">{nick}</span> : null}
      </button>
      {onInfo ? (
        <button
          type="button"
          className="info"
          aria-label={`${character.name} 角色資料`}
          title="角色資料"
          onClick={() => onInfo(character.id)}
        >
          i
        </button>
      ) : null}
    </div>
  );
}
