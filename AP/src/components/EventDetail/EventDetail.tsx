/**
 * S3 事件明細內容（contracts/ui-contracts.md「S3」內容 `db` ①～⑤；FR-012；US1 T054 最小版、US4 T095 擴充）。
 * 依序：標題區（h2 <事件名> ＋ 中繼「第 <a>–<b> 回 ／ 大節 <大節名>」）→ 摘要 → 回目 → 地點 → 參與角色。
 * 外殼（aside.drawer、頁首類別字與關閉鈕、內容區 `.db`）由 Drawer 提供，本元件不自帶 `.db`，
 * 避免組合後出現兩層內距與捲動容器；底部上一個／下一個（`PrevNextNav`）由容器放進 Drawer 的 `footer`。
 * 只吃 props（§FE-4）：回目、參與角色、已選與各操作由容器（EventDrawerContainer）提供。
 */
import { formatChapterRange } from '../../domain/format';
import type { Arc, Chapter, Character, StoryEvent } from '../../domain/types';
import { EventChapters } from './EventChapters';
import { EventParticipants } from './EventParticipants';
import { EventPlace } from './EventPlace';
import './EventDetail.css';

const NONE: readonly never[] = [];

export interface EventDetailProps {
  event: StoryEvent;
  /** 事件所屬大節 */
  arc: Arc;
  /** 事件章回區間內的各回（依回次順序） */
  chapters?: readonly Chapter[];
  /** 參與角色（依資料順序；查無的 id 已略過） */
  participants?: readonly Character[];
  /** 已選角色 id */
  selectedIds?: ReadonlySet<string>;
  /** 點參與角色頭像：加入篩選（面板維持開啟，AC-P19） */
  onAddCharacter?: (characterId: string) => void;
  /** 點參與角色名字：開角色資料 */
  onOpenCharacter?: (characterId: string) => void;
  /** 點「在地圖上看」：切地圖並高亮地點（AC-P21） */
  onGoToPlace?: (placeId: string) => void;
}

export function EventDetail({
  event,
  arc,
  chapters = NONE,
  participants = NONE,
  selectedIds,
  onAddCharacter,
  onOpenCharacter,
  onGoToPlace,
}: EventDetailProps) {
  return (
    <div className="event-detail">
      <div className="ed-head">
        <h2>{event.title}</h2>
        <div className="meta">
          <span>
            <b>{formatChapterRange(event.chapters)}</b>
          </span>
          <span>
            大節 <b>{arc.name}</b>
          </span>
        </div>
      </div>
      <p className="summary">{event.summary}</p>
      <EventChapters chapters={chapters} />
      <EventPlace location={event.location} place={event.place} onGoToPlace={onGoToPlace} />
      <EventParticipants
        participants={participants}
        selectedIds={selectedIds}
        onAdd={onAddCharacter}
        onOpenCharacter={onOpenCharacter}
      />
    </div>
  );
}
