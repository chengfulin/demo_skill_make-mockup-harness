/**
 * 時間軸版面 timelineLayout（T039，US1；plan「時間軸（S2）」、research「版面常數」；
 * Prototype `renderTimeline`；AC-01、AC-P1、AC-S1）
 *
 * 介面（T044 依此實作）：
 *   常數 UNIT_MIN=30、CARD_MIN=170、LANE_H=70、LANE_GAP=8
 *   timelineLayout(events, arcs, range, availableWidth) → TimelineLayout
 *     range: [c0, c1]（含）；全書 [1, 120]，選大節時為該大節 chapters（US3）
 *     unit      每回寬 = max(UNIT_MIN, floor(availableWidth / 回數))
 *     width     總寬 = 回數 × unit
 *     bands[]   與 range 相交的大節色帶 { arc, left, width, alt }；alt＝奇數條（第 1、3、5…條，index 偶數）
 *     ticks[]   { chapter, left, major }；major（有數字）＝起始回與每 10 回；
 *               minor（短刻度）＝ unit ≥ 60 時其餘每回，否則其餘每 5 回
 *     cards[]   依輸入順序 { event, left, top, width, spanWidth, lane }；
 *               left = (起始回 − c0)·unit + 4；spanWidth = 跨回數·unit − 8；width = max(CARD_MIN, spanWidth)；
 *               top = 8 + lane·(LANE_H + LANE_GAP)；貪婪：取第一條 末端 ≤ left 的車道，末端 = left + width + 6
 *     laneCount 車道數；height = laneCount·(LANE_H + LANE_GAP) + 16
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：真實資料 54 事件、12 大節、range [1, 120]、availableWidth 1000
 *
 * | 特徵                 | blocks（非 base 者各為一案）                                    | 對應案例        |
 * | :------------------- | :-------------------------------------------------------------- | :-------------- |
 * | W1 可用寬 / 回數     | < 30（base，取 UNIT_MIN）／= 30 整除／> 30 有餘數取 floor／0    | TL-U1～U4       |
 * | R1 章回範圍          | 全書 1–120（base）／單一大節 43–50                              | TL-B1、TL-B3    |
 * | B1 色帶              | 12 條連續且交替（base）／只含相交大節                           | TL-B1～B3       |
 * | K1 刻度密度          | unit < 60 → 每 5 回（base）／unit ≥ 60 → 每回                   | TL-K1～K3       |
 * | C1 卡片寬            | 跨回寬 − 8 < 170 → 170（base）／≥ 170 → 跨回寬 − 8              | TL-C1～C2       |
 * | L1 車道              | 真實資料全書不重疊（base）／章回重疊事件錯開／不重疊者共用車道 | TL-L1～L3       |
 * | E1 事件數            | 54（base）／0                                                   | TL-E1           |
 *
 * 範圍外（一次性宣告）：range 起訖顛倒或超出 1–120（由容器傳入全書或大節區間，不會發生）；
 * 負數可用寬（ResizeObserver 不會回傳）；事件超出 range（由 filterEvents 先依大節篩選）。
 */
import { describe, expect, it } from 'vitest';
import { arcIdOf, realDataset } from '../test-utils/realDataset';
import type { ChapterRange, StoryEvent } from './types';
import {
  CARD_MIN,
  LANE_GAP,
  LANE_H,
  UNIT_MIN,
  timelineLayout,
  type TimelineLayout,
} from './timelineLayout';

const FULL: ChapterRange = [1, 120];
const { events, arcs } = realDataset;

const base = (): TimelineLayout => timelineLayout(events, arcs, FULL, 1000);

const ev = (id: string, a: number, b: number): StoryEvent => ({
  id,
  title: id,
  chapters: [a, b],
  arc: 'arc-x',
  location: '',
  place: null,
  characters: [],
  summary: '',
});

describe('constants (research 版面常數)', () => {
  it('TL-K0 UNIT_MIN=30, CARD_MIN=170, LANE_H=70, LANE_GAP=8', () => {
    expect([UNIT_MIN, CARD_MIN, LANE_H, LANE_GAP]).toEqual([30, 170, 70, 8]);
  });
});

describe('unit width = max(30, floor(availableWidth / chapters))', () => {
  it('TL-U1 (base) 1000px / 120 chapters -> 30 (UNIT_MIN), total width 3600', () => {
    const l = base();
    expect(l.unit).toBe(30);
    expect(l.width).toBe(3600);
    expect(l.range).toEqual(FULL);
  });

  it('TL-U2 3600px / 120 -> exactly 30', () => {
    expect(timelineLayout(events, arcs, FULL, 3600).unit).toBe(30);
  });

  it('TL-U3 5000px / 120 -> floor(41.67) = 41', () => {
    const l = timelineLayout(events, arcs, FULL, 5000);
    expect(l.unit).toBe(41);
    expect(l.width).toBe(41 * 120);
  });

  it('TL-U4 availableWidth 0 (not yet measured) -> UNIT_MIN', () => {
    expect(timelineLayout(events, arcs, FULL, 0).unit).toBe(30);
  });
});

describe('arc bands', () => {
  it('TL-B1 (base) 12 bands, contiguous, covering the full width (AC-P1)', () => {
    const l = base();
    expect(l.bands).toHaveLength(12);
    expect(l.bands.map((b) => b.arc.id)).toEqual(arcs.map((a) => a.id));
    expect(l.bands[0]!.left).toBe(0);
    for (let i = 1; i < l.bands.length; i += 1) {
      const prev = l.bands[i - 1]!;
      expect(l.bands[i]!.left).toBe(prev.left + prev.width);
    }
    const last = l.bands[l.bands.length - 1]!;
    expect(last.left + last.width).toBe(l.width);
    // 三打祝家莊 43–50：left = 42·30、width = 8·30
    const zhu = l.bands.find((b) => b.arc.id === arcIdOf('三打祝家莊'))!;
    expect(zhu).toMatchObject({ left: 42 * 30, width: 8 * 30 });
  });

  it('TL-B2 odd-numbered bands (1st, 3rd, ...) are marked alt', () => {
    expect(base().bands.map((b) => b.alt)).toEqual(arcs.map((_, i) => i % 2 === 0));
  });

  it('TL-B3 range 43-50 keeps only the intersecting arc, starting at 0', () => {
    const l = timelineLayout([], arcs, [43, 50], 1000);
    expect(l.bands).toHaveLength(1);
    expect(l.bands[0]).toMatchObject({ left: 0, width: l.width, alt: true });
    expect(l.bands[0]!.arc.name).toBe('三打祝家莊');
  });
});

describe('ruler ticks', () => {
  const majors = (l: TimelineLayout) => l.ticks.filter((t) => t.major).map((t) => t.chapter);
  const minors = (l: TimelineLayout) => l.ticks.filter((t) => !t.major).map((t) => t.chapter);

  it('TL-K1 (base) majors at start and every 10; minors every 5 when unit < 60', () => {
    const l = base();
    expect(majors(l)).toEqual([1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]);
    expect(minors(l)).toEqual([5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115]);
    const t20 = l.ticks.find((t) => t.chapter === 20)!;
    expect(t20.left).toBe(19 * 30);
  });

  it('TL-K2 range 43-50 at 1000px (unit 125 >= 60): majors 43, 50; minor every chapter', () => {
    const l = timelineLayout([], arcs, [43, 50], 1000);
    expect(l.unit).toBe(125);
    expect(majors(l)).toEqual([43, 50]);
    expect(minors(l)).toEqual([44, 45, 46, 47, 48, 49]);
    expect(l.ticks.map((t) => t.left)).toEqual([0, 125, 250, 375, 500, 625, 750, 875]);
  });

  it('TL-K3 full book at 7200px (unit exactly 60): minor tick on every chapter', () => {
    const l = timelineLayout(events, arcs, FULL, 7200);
    expect(l.unit).toBe(60);
    expect(l.ticks).toHaveLength(120);
    expect(majors(l)).toHaveLength(13);
  });
});

describe('event cards', () => {
  it('TL-C1 (base) narrow span -> CARD_MIN; position from chapter start', () => {
    const l = base();
    expect(l.cards).toHaveLength(54);
    const zhu = l.cards.find((c) => c.event.title === '三打祝家莊')!; // 47–50
    expect(zhu.left).toBe(46 * 30 + 4);
    expect(zhu.spanWidth).toBe(4 * 30 - 8);
    expect(zhu.width).toBe(170);
    expect(zhu.top).toBe(8 + zhu.lane * (70 + 8));
  });

  it('TL-C2 wide span -> card width = span width - 8', () => {
    const l = timelineLayout(events, arcs, [43, 50], 1000); // unit 125
    const zhu = l.cards.find((c) => c.event.title === '三打祝家莊')!; // 47–50
    expect(zhu.spanWidth).toBe(4 * 125 - 8);
    expect(zhu.width).toBe(492);
    const single = l.cards.find((c) => c.event.title === '沂嶺殺四虎')!; // 43
    expect(single).toMatchObject({ left: 4, spanWidth: 117, width: 170 });
  });

  it('TL-L1 (base) no two cards in the same lane overlap (AC-S1)', () => {
    const l = base();
    expect(l.laneCount).toBeGreaterThan(1);
    for (let lane = 0; lane < l.laneCount; lane += 1) {
      const inLane = l.cards.filter((c) => c.lane === lane).sort((a, b) => a.left - b.left);
      expect(inLane.length).toBeGreaterThan(0);
      for (let i = 1; i < inLane.length; i += 1) {
        const prev = inLane[i - 1]!;
        expect(prev.left + prev.width).toBeLessThanOrEqual(inLane[i]!.left);
      }
    }
    expect(l.height).toBe(l.laneCount * (70 + 8) + 16);
  });

  it('TL-L2 chapter-overlapping events go to different lanes (AC-S1)', () => {
    // 楊雄石秀結義・翠屏山 44–46 與 火燒祝家店 46 章回重疊
    const l = timelineLayout(events, arcs, [43, 50], 1000);
    const a = l.cards.find((c) => c.event.title === '楊雄石秀結義・翠屏山')!;
    const b = l.cards.find((c) => c.event.title === '火燒祝家店')!;
    expect(a.lane).not.toBe(b.lane);
  });

  it('TL-L3 greedy: reuse the first lane whose end <= left (end = left + width + 6)', () => {
    // unit 30：e1 left 4 width 170 → 末端 180；e2 起於第 7 回 left 184 → 回用車道 0；
    // e3 起於第 3 回 left 64 → 車道 0 未空出 → 車道 1
    const l = timelineLayout([ev('e1', 1, 1), ev('e3', 3, 3), ev('e2', 7, 7)], [], FULL, 1000);
    expect(l.cards.map((c) => [c.event.id, c.lane])).toEqual([
      ['e1', 0],
      ['e3', 1],
      ['e2', 0],
    ]);
    expect(l.laneCount).toBe(2);
    const e2 = l.cards[2]!;
    expect(e2.top).toBe(8);
    expect(l.cards[1]!.top).toBe(8 + 78);
  });

  it('TL-E1 no events -> no cards, 0 lanes', () => {
    const l = timelineLayout([], arcs, FULL, 1000);
    expect(l.cards).toEqual([]);
    expect(l.laneCount).toBe(0);
    expect(l.bands).toHaveLength(12);
  });
});
