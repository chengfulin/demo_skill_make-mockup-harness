/**
 * 事件卡（S2；Prototype `evCard`）：`button.ev` > i.span[.pt] → .t（事件名）→ .m（章回＋頭像＋「+N」）。
 * 依據：contracts/ui-contracts.md「S2」事件卡列；AC-S2（頭像最多 3 個＋「+N」）、AC-P5（已選排前加外框）。
 */
import type { CSSProperties } from 'react';
import { formatChapterRange } from '../../domain/format';
import type { Character, StoryEvent } from '../../domain/types';
import { Avatar } from '../Avatar/Avatar';

/** 事件卡最多顯示的頭像數 */
const MAX_AVATARS = 3;

const NO_SELECTION: ReadonlySet<string> = new Set();

export interface EventCardProps {
  event: StoryEvent;
  /** 參與角色（依 `event.characters` 順序；查無的 id 已由呼叫端略過） */
  characters: readonly Character[];
  /** 已選角色 id：頭像排前並加外框 */
  selectedIds?: ReadonlySet<string>;
  onOpen: (eventId: string) => void;
  /** 車道絕對定位與跨回色條寬（`--sw`）；直向列表不給 */
  style?: CSSProperties;
}

export function EventCard({ event, characters, selectedIds = NO_SELECTION, onOpen, style }: EventCardProps) {
  // 穩定排序：已選者在前，其餘保留資料順序
  const ordered = [...characters].sort(
    (a, b) => Number(selectedIds.has(b.id)) - Number(selectedIds.has(a.id)),
  );
  const shown = ordered.slice(0, MAX_AVATARS);
  const more = ordered.length - shown.length;
  const single = event.chapters[0] === event.chapters[1];

  return (
    <button
      type="button"
      className="ev"
      data-testid="event-card"
      style={style}
      onClick={() => onOpen(event.id)}
    >
      <i className={single ? 'span pt' : 'span'} aria-hidden="true" />
      <span className="t">{event.title}</span>
      <span className="m">
        {formatChapterRange(event.chapters)}
        {shown.length > 0 && (
          <span className="avs">
            {shown.map((c) => (
              <Avatar
                key={c.id}
                avatar={c.avatar}
                group={c.group}
                size="sm"
                highlighted={selectedIds.has(c.id)}
              />
            ))}
          </span>
        )}
        {more > 0 && <span className="more">+{more}</span>}
        {ordered.length === 0 && <span className="more">（無收錄角色）</span>}
      </span>
    </button>
  );
}

/** 事件的參與角色（依資料順序；查無的 id 略過）。 */
export function participantsOf(
  event: StoryEvent,
  characterById: ReadonlyMap<string, Character>,
): Character[] {
  return event.characters.flatMap((id) => {
    const c = characterById.get(id);
    return c ? [c] : [];
  });
}
