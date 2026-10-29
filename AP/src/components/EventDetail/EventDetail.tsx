/**
 * S3 事件明細內容（最小版，US1 T054；contracts/ui-contracts.md「S3」內容 `db` ①）。
 * 標題區：h2 <事件名> ＋ 中繼「第 <a>–<b> 回 ／ 大節 <大節名>」。
 * 外殼（aside.drawer、頁首類別字與關閉鈕、內容區 `.db`）由 Drawer 提供，本元件不再自帶 `.db`，
 * 避免組合後出現兩層內距與捲動容器；摘要、回目、地點、參與角色與底部上一個／下一個於 US4（T095）補上。
 */
import { formatChapterRange } from '../../domain/format';
import type { Arc, StoryEvent } from '../../domain/types';
import './EventDetail.css';

export interface EventDetailProps {
  event: StoryEvent;
  /** 事件所屬大節 */
  arc: Arc;
}

export function EventDetail({ event, arc }: EventDetailProps) {
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
    </div>
  );
}
