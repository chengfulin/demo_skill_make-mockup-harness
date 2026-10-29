/**
 * 時間軸版面計算（S2；plan「時間軸（S2，FR-006／FR-007）」、research「版面常數」；
 * 對應 Prototype `renderTimeline`）。純函式，不碰 DOM。
 */
import type { Arc, ChapterRange, StoryEvent } from './types';

/** 每回最小寬（px） */
export const UNIT_MIN = 30;
/** 事件卡最小寬（px） */
export const CARD_MIN = 170;
/** 車道高（px） */
export const LANE_H = 70;
/** 車道間距（px） */
export const LANE_GAP = 8;

/** 卡片相對章回起點的內縮（px） */
const CARD_INSET = 4;
/** 同車道相鄰卡片的最小水平間距（px） */
const CARD_SPACING = 6;
/** 車道區上方留白（px） */
const LANES_TOP = 8;
/** 車道區總高的額外留白（上 8＋下 8） */
const LANES_PAD = 16;
/** 每回寬達此值時每回畫短刻度，否則每 5 回 */
const DENSE_TICK_UNIT = 60;

/** 大節色帶（只含與 range 相交的大節，左緣與寬已截到 range 內）。 */
export interface TimelineBand {
  arc: Arc;
  left: number;
  width: number;
  /** 奇數條（第 1、3、5…條）＝交替底色 `--paper-2` */
  alt: boolean;
}

/** 章回刻度；`major` 標數字（起始回與每 10 回），其餘為短刻度。 */
export interface TimelineTick {
  chapter: number;
  left: number;
  major: boolean;
}

/** 事件卡座標（依輸入事件順序）。 */
export interface TimelineCard {
  event: StoryEvent;
  left: number;
  top: number;
  /** 卡片寬 = max(CARD_MIN, spanWidth) */
  width: number;
  /** 跨回寬 − 8（跨回色條寬） */
  spanWidth: number;
  lane: number;
}

export interface TimelineLayout {
  range: ChapterRange;
  /** 每回寬 */
  unit: number;
  /** 總寬 = 回數 × unit */
  width: number;
  bands: TimelineBand[];
  ticks: TimelineTick[];
  cards: TimelineCard[];
  laneCount: number;
  /** 車道區高度 = laneCount × (LANE_H + LANE_GAP) + 16 */
  height: number;
}

/**
 * 計算時間軸版面。
 * @param events 要畫的事件（已篩選、全書順序）
 * @param arcs 全部大節（只取與 range 相交者）
 * @param range 章回區間（含）；全書 [1, 120]，選大節時為該大節區間
 * @param availableWidth 捲動容器可用寬（px；未量到時可傳 0）
 */
export function timelineLayout(
  events: readonly StoryEvent[],
  arcs: readonly Arc[],
  range: ChapterRange,
  availableWidth: number,
): TimelineLayout {
  const [c0, c1] = range;
  const span = c1 - c0 + 1;
  const unit = Math.max(UNIT_MIN, Math.floor(availableWidth / span));
  const width = span * unit;
  const x = (ch: number) => (ch - c0) * unit;

  const bands: TimelineBand[] = arcs
    .filter((a) => a.chapters[1] >= c0 && a.chapters[0] <= c1)
    .map((arc, i) => {
      const from = Math.max(arc.chapters[0], c0);
      const to = Math.min(arc.chapters[1], c1);
      return { arc, left: x(from), width: (to - from + 1) * unit, alt: i % 2 === 0 };
    });

  const ticks: TimelineTick[] = [];
  for (let ch = c0; ch <= c1; ch += 1) {
    if (ch === c0 || ch % 10 === 0) ticks.push({ chapter: ch, left: x(ch), major: true });
    else if (unit >= DENSE_TICK_UNIT || ch % 5 === 0) {
      ticks.push({ chapter: ch, left: x(ch), major: false });
    }
  }

  const laneEnd: number[] = [];
  const cards: TimelineCard[] = events.map((event) => {
    const left = x(event.chapters[0]) + CARD_INSET;
    const spanWidth = (event.chapters[1] - event.chapters[0] + 1) * unit - 2 * CARD_INSET;
    const cardWidth = Math.max(CARD_MIN, spanWidth);
    let lane = laneEnd.findIndex((end) => end <= left);
    if (lane < 0) {
      lane = laneEnd.length;
      laneEnd.push(0);
    }
    laneEnd[lane] = left + cardWidth + CARD_SPACING;
    return {
      event,
      left,
      top: LANES_TOP + lane * (LANE_H + LANE_GAP),
      width: cardWidth,
      spanWidth,
      lane,
    };
  });

  const laneCount = laneEnd.length;
  return {
    range,
    unit,
    width,
    bands,
    ticks,
    cards,
    laneCount,
    height: laneCount * (LANE_H + LANE_GAP) + LANES_PAD,
  };
}
