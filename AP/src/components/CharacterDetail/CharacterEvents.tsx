/**
 * S4 參與事件區塊（contracts/ui-contracts.md「S4」內容 ⑤；Prototype `.sec` ＞ h4「參與事件（<N>）」＋ `ul.elist`）：
 * 每列一個按鈕「<a>–<b>回」或「<n>回」＋事件名，點擊 → onOpenEvent（開事件明細）。
 * 順序即傳入順序：呼叫端傳 `dataset.eventsByCharacter`（全書順序，G-2）。只吃 props（§FE-4）。
 */
import { formatChapterRangeShort } from '../../domain/format';
import type { StoryEvent } from '../../domain/types';

export interface CharacterEventsProps {
  /** 角色參與的事件（全書順序） */
  events: readonly StoryEvent[];
  /** 點事件：開事件明細 */
  onOpenEvent?: (eventId: string) => void;
}

export function CharacterEvents({ events, onOpenEvent }: CharacterEventsProps) {
  return (
    <div className="sec">
      <h4>參與事件（{events.length}）</h4>
      <ul className="elist">
        {events.map((e) => (
          <li key={e.id}>
            <button type="button" onClick={() => onOpenEvent?.(e.id)}>
              <span>{formatChapterRangeShort(e.chapters)}</span>
              <b>{e.title}</b>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
