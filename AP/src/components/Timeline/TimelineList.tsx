/**
 * 直向列表（S2 ≤720px；Prototype `.vlist > .vgroup`；AC-P42）：依大節分組，
 * 每組 ① 標題 h3（大節名按鈕＋「第 <a>–<b> 回」，點擊＝選大節）② 事件列（章回欄＋事件卡）。
 * 沒有事件的大節不列；結果為 0 時顯示 `empty`。
 */
import type { ReactNode } from 'react';
import type { Arc, Character, StoryEvent } from '../../domain/types';
import { EventCard, participantsOf } from './EventCard';

export interface TimelineListProps {
  /** 已篩選、全書順序 */
  events: readonly StoryEvent[];
  arcs: readonly Arc[];
  characterById: ReadonlyMap<string, Character>;
  selectedIds?: ReadonlySet<string>;
  onOpenEvent: (eventId: string) => void;
  onSelectArc?: (arcId: string) => void;
  empty?: ReactNode;
}

/** 章回欄：「a–b」或「n」 */
function chapterLabel([a, b]: StoryEvent['chapters']): string {
  return a === b ? `${a}` : `${a}–${b}`;
}

export function TimelineList({
  events,
  arcs,
  characterById,
  selectedIds,
  onOpenEvent,
  onSelectArc,
  empty,
}: TimelineListProps) {
  const groups = arcs
    .map((arc) => ({ arc, list: events.filter((e) => e.arc === arc.id) }))
    .filter((g) => g.list.length > 0);

  return (
    <div className="vlist" data-testid="timeline-list">
      {events.length === 0
        ? empty
        : groups.map(({ arc, list }) => (
            <div key={arc.id} className="vgroup">
              <h3>
                <button
                  type="button"
                  onClick={onSelectArc ? () => onSelectArc(arc.id) : undefined}
                >
                  {arc.name}
                </button>
                <small>
                  第 {arc.chapters[0]}–{arc.chapters[1]} 回
                </small>
              </h3>
              <div className="stack">
                {list.map((event) => (
                  <div key={event.id} className="vrow">
                    <div className="ch">{chapterLabel(event.chapters)}</div>
                    <EventCard
                      event={event}
                      characters={participantsOf(event, characterById)}
                      selectedIds={selectedIds}
                      onOpen={onOpenEvent}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
    </div>
  );
}
