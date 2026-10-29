/**
 * 上一個／下一個純函式 prevNext（T085；FR-012、G-2；AC-P20、AC-S15、AC-S26）
 *
 * prevNext(id, filtered, all) → { prev: StoryEvent | null; next: StoryEvent | null }
 *   id 在 filtered 中 → 依 filtered 順序取前後；否則 → 依 all（全書順序）取前後（G-2）。
 *   位於首個 prev 為 null、位於末個 next 為 null；id 兩者皆無 → 皆 null。
 * Oracle：真實資料（realDataset）上的 AC 事件名。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：只選林沖，開篩選結果中段的「楊志賣刀」→ prev 風雪山神廟、next 晁蓋梁山小奪泊（全書順序的下一個是七星聚義，可區分兩種依據）
 *
 * | 特徵                     | blocks（非 base 者各為一案）                                       | 對應案例   |
 * | :----------------------- | :----------------------------------------------------------------- | :--------- |
 * | N1 依據清單              | 在 filtered 中（base）／不在 filtered → 全書（G-2）                | NAV-1      |
 * | N2 篩選內容              | 單一角色（base；另驗大鬧野豬林前一個＝林沖誤入白虎堂）／林沖＋魯智深（AC-P20 下一個＝棒打洪教頭） | NAV-2a、NAV-2 |
 * | N3 位置                  | 中段（base）／filtered 首個（AC-S26）／全書末個（AC-S15）／全書首個 | NAV-3～NAV-5 |
 * | N4 filtered＝全部（未篩選）| 與全書順序一致                                                     | NAV-6      |
 * | N5 id 不存在             | prev、next 皆 null                                                 | NAV-7      |
 *
 * 範圍外（一次性宣告）：filtered 不為 all 的子序列（由 filterEvents 保證保留全書順序）；重複 id（資料驗證保證唯一）。
 */
import { describe, expect, it } from 'vitest';
import { idOf, realDataset } from '../test-utils/realDataset';
import { filterEvents } from './filter';
import { prevNext } from './navigation';
import type { StoryEvent } from './types';

const { events } = realDataset;
const idByTitle = (title: string): string => {
  const e = events.find((ev) => ev.title === title);
  if (!e) throw new Error(`realDataset 找不到事件：${title}`);
  return e.id;
};
const filteredBy = (names: string[]) => filterEvents(events, names.map(idOf), null);
const titles = (r: { prev: StoryEvent | null; next: StoryEvent | null }) => [
  r.prev?.title ?? null,
  r.next?.title ?? null,
];

describe('prevNext', () => {
  it('BASE Lin Chong filter, middle event uses filtered order', () => {
    const r = prevNext(idByTitle('楊志賣刀'), filteredBy(['林沖']), events);
    expect(titles(r)).toEqual(['風雪山神廟', '晁蓋梁山小奪泊']);
  });

  it('NAV-1 event not in filtered falls back to full-book order (G-2)', () => {
    // 只選武松時開「大鬧野豬林」：不在篩選結果中，依全書順序
    const r = prevNext(idByTitle('大鬧野豬林'), filteredBy(['武松']), events);
    const i = events.findIndex((e) => e.title === '大鬧野豬林');
    expect(r.prev).toBe(events[i - 1]);
    expect(r.next).toBe(events[i + 1]);
    expect(titles(r)).toEqual(['林沖誤入白虎堂', '棒打洪教頭']);
  });

  it('NAV-2a Lin Chong only: prev of 大鬧野豬林 is 林沖誤入白虎堂', () => {
    const r = prevNext(idByTitle('大鬧野豬林'), filteredBy(['林沖']), events);
    expect(r.prev?.title).toBe('林沖誤入白虎堂');
  });

  it('NAV-2 Lin Chong + Lu Zhishen: next of 大鬧野豬林 is 棒打洪教頭 (AC-P20)', () => {
    const r = prevNext(idByTitle('大鬧野豬林'), filteredBy(['林沖', '魯智深']), events);
    expect(r.next?.title).toBe('棒打洪教頭');
    expect(r.prev?.title).toBe('林沖誤入白虎堂');
  });

  it('NAV-3 first of filtered: prev null, next 林沖誤入白虎堂 (AC-S26)', () => {
    const r = prevNext(idByTitle('倒拔垂楊柳・林沖結義'), filteredBy(['林沖']), events);
    expect(r.prev).toBeNull();
    expect(r.next?.title).toBe('林沖誤入白虎堂');
  });

  it('NAV-4 last of full book outside filter: next null, prev 眾將散去 (AC-S15)', () => {
    const r = prevNext(idByTitle('宋公明神聚蓼兒洼'), filteredBy(['林沖']), events);
    expect(r.next).toBeNull();
    expect(r.prev?.title).toBe('眾將散去');
  });

  it('NAV-5 first of full book: prev null', () => {
    const r = prevNext(events[0].id, events, events);
    expect(r.prev).toBeNull();
    expect(r.next).toBe(events[1]);
  });

  it('NAV-6 unfiltered (filtered = all) follows full-book order', () => {
    const r = prevNext(events[10].id, events, events);
    expect(r).toEqual({ prev: events[9], next: events[11] });
  });

  it('NAV-7 unknown id returns both null', () => {
    expect(prevNext('ev-999', events, events)).toEqual({ prev: null, next: null });
  });
});
