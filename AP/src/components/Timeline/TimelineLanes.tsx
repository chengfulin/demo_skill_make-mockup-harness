/**
 * 事件車道（S2 ③；Prototype `.lanes`）：依 `timelineLayout` 的卡片座標絕對定位 `EventCard`；
 * 橫向捲動由外層 `tl-scroll` 負責。
 */
import type { CSSProperties } from 'react';
import { LANE_H, type TimelineCard } from '../../domain/timelineLayout';
import type { Character } from '../../domain/types';
import { EventCard, participantsOf } from './EventCard';

export interface TimelineLanesProps {
  cards: readonly TimelineCard[];
  /** 時間軸總寬（px） */
  width: number;
  /** 車道區高（px） */
  height: number;
  characterById: ReadonlyMap<string, Character>;
  selectedIds?: ReadonlySet<string>;
  onOpenEvent: (eventId: string) => void;
}

export function TimelineLanes({
  cards,
  width,
  height,
  characterById,
  selectedIds,
  onOpenEvent,
}: TimelineLanesProps) {
  return (
    <div className="lanes" style={{ width, height }}>
      {cards.map((card) => (
        <EventCard
          key={card.event.id}
          event={card.event}
          characters={participantsOf(card.event, characterById)}
          selectedIds={selectedIds}
          onOpen={onOpenEvent}
          style={
            {
              left: card.left,
              top: card.top,
              width: card.width,
              height: LANE_H,
              '--sw': `${card.spanWidth}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
