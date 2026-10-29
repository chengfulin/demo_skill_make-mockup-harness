/**
 * 資料驗證 validateDataset（T014；data-model.md §3 V1～V7；FR-001、FR-002、FR-013、FR-014、FR-022）
 *
 * 規則原文（data-model.md §3）：
 *   V1 筆數：大節 12、章回 120、角色 22、事件 54、地點 32、關係 13
 *   V2 大節依序連續、不重疊，第一個起於 1、最後一個止於 120
 *   V3 事件 `1 ≤ 起回 ≤ 迄回 ≤ 120`，且起回落在所屬大節範圍內（迄回可延伸到下一大節）
 *   V4 事件的 `arc`、`place`（非 null 時）、`characters[*]` 都存在
 *   V5 關係兩端角色存在，且 `type` 為六種之一
 *   V6 角色 `firstChapter ≤ joinChapter ≤ fateChapter`（有值者）；`group` 為天罡／地煞時
 *      `star`、`rank` 非 null，其他時皆為 null
 *   V7 id 唯一
 * 回傳：`{ ok: true } | { ok: false, errors: string[] }`；每條錯誤訊息以規則編號（V1…V7）開頭。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：`makeRawDataset()` 合成資料（V1～V7 全成立）→ ok
 *
 * | 特徵                         | blocks（非 base 者各為一案）                                         | 對應案例   |
 * | :--------------------------- | :------------------------------------------------------------------- | :--------- |
 * | C1 各實體筆數（V1）          | 符合／某實體少 1（6 實體各一）／多 1                                 | V1-1～V1-7 |
 * | C2 大節銜接（V2）            | 連續／首個不起於 1／末個不止於 120／中間有缺口／重疊／順序顛倒       | V2-1～V2-5 |
 * | C3 事件章回（V3）            | 合法／迄回跨到下一大節（合法）／起回 < 1／迄回 > 120／起回 > 迄回／起回早於所屬大節／起回晚於所屬大節 | V3-0～V3-5 |
 * | C4 事件參照（V4）            | 皆存在（含 place=null）／arc 不存在／place 不存在／某角色不存在       | V4-1～V4-4 |
 * | C5 關係（V5）                | 合法／a 不存在／b 不存在／type 不在六種之內                          | V5-1～V5-3 |
 * | C6 角色章回順序（V6）        | 合法（含 join/fate 為 null）／first > join／join > fate／first > fate（join 為 null） | V6-1～V6-4 |
 * | C7 角色群組與星號座次（V6）  | 合法／天罡缺 star／地煞缺 rank／其他卻有 star／其他卻有 rank          | V6-5～V6-8 |
 * | C8 id 唯一（V7）             | 唯一／重複的 arc、chapter.no、character、event、place id             | V7-1～V7-5 |
 *
 * 邊界值：章回 1 與 120（base 的首尾大節即落在邊界）；V6 等號成立（first = join = fate）視為合法。
 * 錯誤累積：多處同時違規時回傳全部錯誤（MULTI）。
 * 範圍外（一次性宣告）：欄位型別錯誤（如 chapters 非數字陣列）——資料由轉換腳本產生並 commit，
 * 執行期僅防禦「不是陣列」一種情況；關係的自我參照、重複關係不在 V1～V7 之內。
 */
import { describe, expect, it } from 'vitest';
import { makeRawDataset } from '../test-utils/rawDatasetFactory';
import type { RawDataset } from '../domain/types';
import { validateDataset } from './validateDataset';

function errorsOf(raw: RawDataset): string[] {
  const result = validateDataset(raw);
  return result.ok ? [] : result.errors;
}

function expectRule(raw: RawDataset, rule: string) {
  const result = validateDataset(raw);
  expect(result.ok).toBe(false);
  const errors = errorsOf(raw);
  expect(errors.some((e) => e.startsWith(`${rule} `) || e.startsWith(`${rule}：`))).toBe(true);
}

describe('validateDataset — base', () => {
  it('BASE synthetic dataset passes', () => {
    expect(validateDataset(makeRawDataset())).toEqual({ ok: true });
  });

  it('BASE-EQ first = join = fate is valid', () => {
    const raw = makeRawDataset();
    Object.assign(raw.characters[0], { firstChapter: 50, joinChapter: 50, fateChapter: 50 });
    expect(validateDataset(raw)).toEqual({ ok: true });
  });
});

describe('V1 counts', () => {
  const keys = ['arcs', 'chapters', 'characters', 'events', 'places', 'relations'] as const;

  it.each(keys)('V1 %s one fewer fails', (key) => {
    const raw = makeRawDataset();
    // 移除最後一筆；被參照者（如角色、地點、大節）可能連帶觸發其他規則，這裡只斷言 V1 被報出
    raw[key].pop();
    expectRule(raw, 'V1');
  });

  it('V1-7 one extra place fails', () => {
    const raw = makeRawDataset();
    raw.places.push({ id: '多出', name: '多出', lon: 115, lat: 35 });
    expectRule(raw, 'V1');
  });

  it('V1 non-array collection fails without throwing', () => {
    const raw = makeRawDataset();
    (raw as unknown as Record<string, unknown>).events = { length: 54 };
    expect(() => validateDataset(raw)).not.toThrow();
    expectRule(raw, 'V1');
  });
});

describe('V2 arcs contiguous', () => {
  it('V2-1 first arc not starting at 1', () => {
    const raw = makeRawDataset();
    raw.arcs[0].chapters = [2, 10];
    expectRule(raw, 'V2');
  });

  it('V2-2 last arc not ending at 120', () => {
    const raw = makeRawDataset();
    raw.arcs[11].chapters = [111, 119];
    expectRule(raw, 'V2');
  });

  it('V2-3 gap between arcs', () => {
    const raw = makeRawDataset();
    raw.arcs[3].chapters = [31, 39]; // 下一個起於 41，缺第 40 回
    expectRule(raw, 'V2');
  });

  it('V2-4 overlapping arcs', () => {
    const raw = makeRawDataset();
    raw.arcs[3].chapters = [31, 41]; // 下一個起於 41
    expectRule(raw, 'V2');
  });

  it('V2-5 arcs out of order', () => {
    const raw = makeRawDataset();
    [raw.arcs[2], raw.arcs[3]] = [raw.arcs[3], raw.arcs[2]];
    expectRule(raw, 'V2');
  });
});

describe('V3 event chapters', () => {
  it('V3-0 end chapter extending into next arc is valid', () => {
    // 對應 Prototype ev-16 柴進莊上會武松 [22, 23] 屬 arc-02 [13, 22]
    const raw = makeRawDataset();
    raw.events[0].chapters = [10, 11]; // arc-01 為 1–10，迄回延伸到 arc-02
    expect(validateDataset(raw)).toEqual({ ok: true });
  });

  it('V3-1 start chapter below 1', () => {
    const raw = makeRawDataset();
    raw.events[0].chapters = [0, 2]; // 事件 0 屬 arc-01
    expectRule(raw, 'V3');
  });

  it('V3-2 end chapter above 120', () => {
    const raw = makeRawDataset();
    raw.events[11].chapters = [119, 121]; // 事件 11 屬 arc-12
    expectRule(raw, 'V3');
  });

  it('V3-3 start after end', () => {
    const raw = makeRawDataset();
    raw.events[0].chapters = [5, 3];
    expectRule(raw, 'V3');
  });

  it('V3-4 start chapter before its arc', () => {
    const raw = makeRawDataset();
    raw.events[1].chapters = [10, 12]; // 事件 1 屬 arc-02（11–20）
    expectRule(raw, 'V3');
  });

  it('V3-5 start chapter after its arc', () => {
    const raw = makeRawDataset();
    raw.events[0].chapters = [11, 12]; // arc-01 為 1–10
    expectRule(raw, 'V3');
  });
});

describe('V4 event references', () => {
  it('V4-1 null place is allowed', () => {
    const raw = makeRawDataset();
    raw.events[0].place = null;
    expect(validateDataset(raw)).toEqual({ ok: true });
  });

  it('V4-2 unknown arc', () => {
    const raw = makeRawDataset();
    raw.events[0].arc = 'arc-99';
    expectRule(raw, 'V4');
  });

  it('V4-3 unknown place', () => {
    const raw = makeRawDataset();
    raw.events[0].place = '不存在的地點';
    expectRule(raw, 'V4');
  });

  it('V4-4 unknown character', () => {
    const raw = makeRawDataset();
    raw.events[1].characters = ['c01', 'nobody'];
    expectRule(raw, 'V4');
  });
});

describe('V5 relations', () => {
  it('V5-1 unknown endpoint a', () => {
    const raw = makeRawDataset();
    raw.relations[0].a = 'nobody';
    expectRule(raw, 'V5');
  });

  it('V5-2 unknown endpoint b', () => {
    const raw = makeRawDataset();
    raw.relations[0].b = 'nobody';
    expectRule(raw, 'V5');
  });

  it('V5-3 type not one of six', () => {
    const raw = makeRawDataset();
    (raw.relations[0] as { type: string }).type = '同鄉';
    expectRule(raw, 'V5');
  });
});

describe('V6 character chapters and group', () => {
  it('V6-1 base characters with null join/fate pass', () => {
    const raw = makeRawDataset();
    expect(raw.characters[21].joinChapter).toBeNull();
    expect(validateDataset(raw)).toEqual({ ok: true });
  });

  it('V6-2 firstChapter after joinChapter', () => {
    const raw = makeRawDataset();
    Object.assign(raw.characters[0], { firstChapter: 40, joinChapter: 30 });
    expectRule(raw, 'V6');
  });

  it('V6-3 joinChapter after fateChapter', () => {
    const raw = makeRawDataset();
    Object.assign(raw.characters[0], { joinChapter: 110, fateChapter: 100 });
    expectRule(raw, 'V6');
  });

  it('V6-4 firstChapter after fateChapter with null join', () => {
    const raw = makeRawDataset();
    Object.assign(raw.characters[21], { firstChapter: 50, fateChapter: 40 });
    expectRule(raw, 'V6');
  });

  it('V6-5 tiangang without star', () => {
    const raw = makeRawDataset();
    raw.characters[0].star = null;
    expectRule(raw, 'V6');
  });

  it('V6-6 disha without rank', () => {
    const raw = makeRawDataset();
    raw.characters[17].rank = null;
    expectRule(raw, 'V6');
  });

  it('V6-7 other group with star', () => {
    const raw = makeRawDataset();
    raw.characters[20].star = '天魁星';
    expectRule(raw, 'V6');
  });

  it('V6-8 other group with rank', () => {
    const raw = makeRawDataset();
    raw.characters[20].rank = 1;
    expectRule(raw, 'V6');
  });
});

describe('V7 unique ids', () => {
  it('V7-1 duplicate arc id', () => {
    const raw = makeRawDataset();
    raw.arcs[1].id = raw.arcs[0].id;
    expectRule(raw, 'V7');
  });

  it('V7-2 duplicate chapter no', () => {
    const raw = makeRawDataset();
    raw.chapters[1].no = raw.chapters[0].no;
    expectRule(raw, 'V7');
  });

  it('V7-3 duplicate character id', () => {
    const raw = makeRawDataset();
    raw.characters[21].id = raw.characters[20].id;
    expectRule(raw, 'V7');
  });

  it('V7-4 duplicate event id', () => {
    const raw = makeRawDataset();
    raw.events[1].id = raw.events[0].id;
    expectRule(raw, 'V7');
  });

  it('V7-5 duplicate place id', () => {
    const raw = makeRawDataset();
    raw.places[1].id = raw.places[0].id;
    expectRule(raw, 'V7');
  });
});

describe('error accumulation', () => {
  it('MULTI reports every violated rule', () => {
    const raw = makeRawDataset();
    raw.events[0].arc = 'arc-99';
    raw.relations[0].a = 'nobody';
    raw.characters[0].star = null;
    const errors = errorsOf(raw);
    expect(errors.some((e) => e.startsWith('V4'))).toBe(true);
    expect(errors.some((e) => e.startsWith('V5'))).toBe(true);
    expect(errors.some((e) => e.startsWith('V6'))).toBe(true);
  });
});
