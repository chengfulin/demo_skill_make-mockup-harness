/**
 * S3 參與角色區塊（Prototype `.sec` ＞ h4「參與角色」＋ `.people` ＞ `.person`）：
 * 每列 頭像鈕（`title`「加入篩選」、`aria-label`「將 <姓名> 加入篩選」→ onAdd）→ 名字鈕（→ onOpenCharacter）
 * → 主綽號 →（已選時）「已在篩選中」；已選者頭像加朱色外框。
 * 有角色時附提示「點頭像加入篩選，點名字看角色資料。」；無角色顯示「本事件沒有收錄名單中的角色。」。
 */
import type { Character } from '../../domain/types';
import { Avatar } from '../Avatar/Avatar';

const NO_SELECTION: ReadonlySet<string> = new Set();

export interface EventParticipantsProps {
  /** 參與角色（依資料順序；查無的 id 已由呼叫端略過） */
  participants: readonly Character[];
  /** 已選角色 id：外框＋「已在篩選中」 */
  selectedIds?: ReadonlySet<string>;
  /** 點頭像：加入篩選 */
  onAdd?: (characterId: string) => void;
  /** 點名字：開角色資料 */
  onOpenCharacter?: (characterId: string) => void;
}

export function EventParticipants({
  participants,
  selectedIds = NO_SELECTION,
  onAdd,
  onOpenCharacter,
}: EventParticipantsProps) {
  return (
    <div className="sec">
      <h4>參與角色</h4>
      {participants.length > 0 ? (
        <>
          <div className="people">
            {participants.map((c) => {
              const selected = selectedIds.has(c.id);
              return (
                <div className="person" key={c.id}>
                  <button
                    type="button"
                    className="add"
                    title="加入篩選"
                    aria-label={`將 ${c.name} 加入篩選`}
                    onClick={() => onAdd?.(c.id)}
                  >
                    <Avatar avatar={c.avatar} group={c.group} size="lg" highlighted={selected} />
                  </button>
                  <button type="button" className="nmb" onClick={() => onOpenCharacter?.(c.id)}>
                    {c.name}
                  </button>
                  <small>{c.nicknames[0] ?? ''}</small>
                  {selected && <span className="added">已在篩選中</span>}
                </div>
              );
            })}
          </div>
          <p className="hint">點頭像加入篩選，點名字看角色資料。</p>
        </>
      ) : (
        <p className="hint">本事件沒有收錄名單中的角色。</p>
      )}
    </div>
  );
}
