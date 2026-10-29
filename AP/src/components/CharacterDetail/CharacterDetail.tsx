/**
 * S4 角色資料內容（T109；contracts/ui-contracts.md「S4」；FR-013、FR-014；AC-12、AC-13、AC-P22～AC-P25）。
 * `.character-detail`（display: contents，`.db` 由 Drawer 提供）內依序：身分 `.cd-head` → 狀態 `.sec`（StatusBar）→
 * 結局 `.sec`（「<fate>（第 <n> 回）」，無結局回只放 fate）→ `button.primary`「只看此角色」→
 * 參與事件 `.sec` → 人物關係 `.sec`。只吃 props（§FE-4）；資料由容器（CharacterDrawerContainer）組好。
 */
import { milestones, statusSegments } from '../../domain/status';
import type { Character, StoryEvent } from '../../domain/types';
import { CharacterEvents } from './CharacterEvents';
import { CharacterIdentity } from './CharacterIdentity';
import { CharacterRelations, type RelatedCharacter } from './CharacterRelations';
import { StatusBar } from './StatusBar';
import './CharacterDetail.css';

const NO_EVENTS: readonly StoryEvent[] = [];
const NO_RELATIONS: readonly RelatedCharacter[] = [];

export interface CharacterDetailProps {
  character: Character;
  /** 參與事件（全書順序） */
  events?: readonly StoryEvent[];
  /** 人物關係（依資料順序） */
  relations?: readonly RelatedCharacter[];
  /** 「只看此角色」 */
  onOnlyCharacter?: (characterId: string) => void;
  /** 點參與事件：開事件明細 */
  onOpenEvent?: (eventId: string) => void;
  /** 點關係對象：開其角色資料 */
  onOpenCharacter?: (characterId: string) => void;
}

export function CharacterDetail({
  character: c,
  events = NO_EVENTS,
  relations = NO_RELATIONS,
  onOnlyCharacter,
  onOpenEvent,
  onOpenCharacter,
}: CharacterDetailProps) {
  return (
    <div className="character-detail">
      <CharacterIdentity character={c} />
      <StatusBar segments={statusSegments(c)} milestones={milestones(c)} />
      <div className="sec">
        <h4>結局</h4>
        <p className="summary fate">
          {c.fate}
          {c.fateChapter !== null ? `（第 ${c.fateChapter} 回）` : ''}
        </p>
      </div>
      <button type="button" className="primary" onClick={() => onOnlyCharacter?.(c.id)}>
        只看此角色
      </button>
      <CharacterEvents events={events} onOpenEvent={onOpenEvent} />
      <CharacterRelations relations={relations} onOpenCharacter={onOpenCharacter} />
    </div>
  );
}
