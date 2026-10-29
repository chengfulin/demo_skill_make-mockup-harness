/**
 * 角色狀態推算（T098；data-model.md §5「角色狀態」、§6 狀態轉換；FR-013、D-2；AC-12、AC-P22、AC-P23、AC-S16）
 *
 * 介面（T103 依此實作；純函式，不修改輸入）：
 *   CHAPTER_COUNT = 120
 *   statusAt(c, n) → CharacterStatus
 *     `fateChapter≠null 且 n≥fateChapter` → 已死亡或離散；否則 `joinChapter≠null 且 n≥joinChapter` → 已上梁山；
 *     否則 `n≥firstChapter` → 在野；否則 未登場。
 *   statusSegments(c) → { status, from, to, count }[]：1–120 回依序合併成連續同狀態區段（count = to − from + 1，總和 120）
 *   milestones(c) → { label: '登場'|'上梁山'|'結局', chapter }[]：依此順序，值為 null 者不產生
 *   statusAriaLabel(segments) → 「<狀態> <count> 回」以全形逗號「，」相接
 * Oracle：真實資料（realDataset）的 AC 數字。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：晁蓋（firstChapter 14、joinChapter 20、fateChapter 60；非一百單八將）
 *
 * | 特徵                         | blocks（非 base 者各為一案）                                         | 對應案例       |
 * | :--------------------------- | :------------------------------------------------------------------- | :------------- |
 * | A1 n 相對登場回              | n<first（未登場）／n=first（base 邊界）                              | AT-1           |
 * | A2 n 相對上梁山回            | first≤n<join（在野）／n=join（已上梁山）                             | AT-1           |
 * | A3 n 相對結局回              | join≤n<fate（已上梁山）／n=fate（已死亡或離散，優先於已上梁山）／n=120 | AT-1          |
 * | A4 joinChapter               | 有（base）／null 且有結局（在野→已死亡或離散，跳過已上梁山）         | AT-2           |
 * | A5 fateChapter               | 有（base）／null（停在最後狀態：高俅全書在野）                       | AT-3、SEG-2    |
 * | A6 結局性質（D-2）           | 死亡（base）／離開未死（公孫勝歸山，第 110 回起仍為已死亡或離散）    | SEG-3          |
 * | S1 區段組成                  | 四段（base，AC-P22）／兩段（高俅，AC-P23）／末段非已上梁山（AC-S16） | SEG-1～SEG-3   |
 * | S2 區段不變量                | 首段 from=1、末段 to=120、相鄰銜接、count 總和 120（全角色）         | SEG-4          |
 * | M1 節點                      | 三個（base）／只有登場（高俅）                                       | MS-1～MS-2     |
 * | L1 aria-label                | 四段（base）／兩段（高俅）                                           | ARIA-1～ARIA-2 |
 * | P1 純度                      | 不修改輸入角色                                                       | PURE-1         |
 *
 * 範圍外（一次性宣告）：n 超出 1–120（呼叫端只以 1–120 迭代）；firstChapter > joinChapter 或 joinChapter > fateChapter
 * 等資料矛盾（validateDataset 拒絕）；狀態條像素寬度與顏色（StatusBar 元件與 CSS token）。
 */
import { describe, expect, it } from 'vitest';
import type { Character } from './types';
import { idOf, realDataset } from '../test-utils/realDataset';
import { CHAPTER_COUNT, milestones, statusAriaLabel, statusAt, statusSegments } from './status';

function charOf(name: string): Character {
  return realDataset.characterById.get(idOf(name))!;
}

/** 區段簡寫：[狀態, 回數] */
function shape(c: Character): [string, number][] {
  return statusSegments(c).map((s) => [s.status, s.count]);
}

describe('statusAt (FR-013, D-2)', () => {
  it('AT-1 晁蓋: boundaries at first / join / fate chapters', () => {
    const c = charOf('晁蓋');
    expect(statusAt(c, 1)).toBe('未登場');
    expect(statusAt(c, 13)).toBe('未登場');
    expect(statusAt(c, 14)).toBe('在野');
    expect(statusAt(c, 19)).toBe('在野');
    expect(statusAt(c, 20)).toBe('已上梁山');
    expect(statusAt(c, 59)).toBe('已上梁山');
    expect(statusAt(c, 60)).toBe('已死亡或離散');
    expect(statusAt(c, 120)).toBe('已死亡或離散');
  });

  it('AT-2 never joined but has a fate chapter skips 已上梁山', () => {
    const c: Character = { ...charOf('晁蓋'), joinChapter: null };
    expect(statusAt(c, 20)).toBe('在野');
    expect(statusAt(c, 59)).toBe('在野');
    expect(statusAt(c, 60)).toBe('已死亡或離散');
  });

  it('AT-3 高俅 (no join, no fate) stays 在野 to chapter 120', () => {
    const c = charOf('高俅');
    expect(statusAt(c, 1)).toBe('未登場');
    expect(statusAt(c, 2)).toBe('在野');
    expect(statusAt(c, 120)).toBe('在野');
  });
});

describe('statusSegments', () => {
  it('SEG-1 晁蓋: 未登場 13 / 在野 6 / 已上梁山 40 / 已死亡或離散 61 (AC-P22, AC-12)', () => {
    expect(shape(charOf('晁蓋'))).toEqual([
      ['未登場', 13],
      ['在野', 6],
      ['已上梁山', 40],
      ['已死亡或離散', 61],
    ]);
    const segs = statusSegments(charOf('晁蓋'));
    expect(segs[3]).toEqual({ status: '已死亡或離散', from: 60, to: 120, count: 61 });
  });

  it('SEG-2 高俅: 未登場 1 / 在野 119 (AC-P23)', () => {
    expect(shape(charOf('高俅'))).toEqual([
      ['未登場', 1],
      ['在野', 119],
    ]);
  });

  it('SEG-3 公孫勝: 110–120 is 已死亡或離散 and the last segment is not 已上梁山 (AC-S16, D-2)', () => {
    const segs = statusSegments(charOf('公孫勝'));
    const last = segs[segs.length - 1];
    expect(last).toEqual({ status: '已死亡或離散', from: 110, to: 120, count: 11 });
    expect(last.status).not.toBe('已上梁山');
    for (let n = 110; n <= 120; n++) expect(statusAt(charOf('公孫勝'), n)).toBe('已死亡或離散');
  });

  it('SEG-4 every character: segments cover 1–120 contiguously, adjacent statuses differ', () => {
    for (const c of realDataset.characters) {
      const segs = statusSegments(c);
      expect(segs[0].from).toBe(1);
      expect(segs[segs.length - 1].to).toBe(CHAPTER_COUNT);
      expect(segs.reduce((sum, s) => sum + s.count, 0)).toBe(CHAPTER_COUNT);
      segs.forEach((s, i) => {
        expect(s.count).toBe(s.to - s.from + 1);
        if (i > 0) {
          expect(s.from).toBe(segs[i - 1].to + 1);
          expect(s.status).not.toBe(segs[i - 1].status);
        }
      });
    }
  });
});

describe('milestones', () => {
  it('MS-1 晁蓋: 登場 14, 上梁山 20, 結局 60 in order', () => {
    expect(milestones(charOf('晁蓋'))).toEqual([
      { label: '登場', chapter: 14 },
      { label: '上梁山', chapter: 20 },
      { label: '結局', chapter: 60 },
    ]);
  });

  it('MS-2 高俅: only 登場 2 (null values produce no milestone)', () => {
    expect(milestones(charOf('高俅'))).toEqual([{ label: '登場', chapter: 2 }]);
  });
});

describe('statusAriaLabel', () => {
  it('ARIA-1 晁蓋 four segments', () => {
    expect(statusAriaLabel(statusSegments(charOf('晁蓋')))).toBe(
      '未登場 13 回，在野 6 回，已上梁山 40 回，已死亡或離散 61 回',
    );
  });

  it('ARIA-2 高俅 two segments', () => {
    expect(statusAriaLabel(statusSegments(charOf('高俅')))).toBe('未登場 1 回，在野 119 回');
  });
});

describe('purity', () => {
  it('PURE-1 does not mutate the character', () => {
    const c = charOf('晁蓋');
    const snapshot = structuredClone(c);
    statusSegments(c);
    milestones(c);
    statusAt(c, 50);
    expect(c).toEqual(snapshot);
  });
});
