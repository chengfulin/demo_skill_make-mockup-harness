/**
 * 角色選取純函式（T060；data-model.md §5「天罡／地煞快選」；FR-003、FR-010、G-7）
 *
 * 介面（T065 依此實作；selected 為「依加入順序」的 id 陣列，函式不修改輸入）：
 *   toggle(selected, id)       未選→加到最後；已選→移除
 *   add(selected, id)          未選→加到最後；已選→原陣列（同一參照，不重複）
 *   remove(selected, id)       移除；不在其中→原陣列（同一參照）
 *   clear()                    → []
 *   only(id)                   → [id]（US5「只看此角色」）
 *   groupToggle(selected, members)
 *     members 全在 selected 中 → 只移除 members（保留其他，順序不變）；
 *     否則 → 依 members 順序把未選者加到最後（保留既有選取與順序）。
 * Oracle：真實資料（realDataset）的群組成員與 AC 數字。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：selected 空、操作對象為單一角色（林沖）
 *
 * | 特徵                         | blocks（非 base 者各為一案）                                  | 對應案例       |
 * | :--------------------------- | :------------------------------------------------------------ | :------------- |
 * | S1 操作                      | toggle（base）／add／remove／clear／only                      | SEL-1～SEL-9   |
 * | S2 對象是否已選              | 未選（base）／已選                                            | SEL-2、SEL-4、SEL-6 |
 * | S3 既有選取數                | 0（base）／1／多（順序保留）                                  | SEL-3、SEL-5   |
 * | G1 群組成員選取程度          | 全未選／部分已選／全已選                                      | GRP-1～GRP-4   |
 * | G2 群組外的既有選取          | 無／有（晁蓋，非一百單八將）                                  | GRP-5～GRP-6   |
 * | G3 群組                      | 天罡 17 位（AC-P9、AC-P10）／地煞（AC-S7）                    | GRP-1～GRP-3   |
 * | P1 純度                      | 不修改輸入                                                    | PURE-1         |
 *
 * 範圍外（一次性宣告）：id 不存在於資料（id 由 chip 列產生）；members 為空陣列（群組成員由資料算出，必非空）；
 * members 含重複 id（由資料 id 唯一保證）。
 */
import { describe, expect, it } from 'vitest';
import { idOf, realDataset } from '../test-utils/realDataset';
import type { CharacterGroup } from './types';
import { add, clear, groupToggle, only, remove, toggle } from './selection';

const members = (g: CharacterGroup) => realDataset.characters.filter((c) => c.group === g).map((c) => c.id);
const TG = members('天罡');
const DS = members('地煞');
const linchong = idOf('林沖');
const wusong = idOf('武松');
const songjiang = idOf('宋江');
const chaogai = idOf('晁蓋');

describe('toggle / add / remove / clear / only', () => {
  it('BASE toggle on empty selects the character', () => {
    expect(toggle([], linchong)).toEqual([linchong]);
  });

  it('SEL-1 toggle appends to the end (keeps insertion order)', () => {
    expect(toggle([wusong, songjiang], linchong)).toEqual([wusong, songjiang, linchong]);
  });

  it('SEL-2 toggle on a selected character removes it', () => {
    expect(toggle([wusong, linchong, songjiang], linchong)).toEqual([wusong, songjiang]);
  });

  it('SEL-3 add appends a new id', () => {
    expect(add([wusong], linchong)).toEqual([wusong, linchong]);
  });

  it('SEL-4 add an already selected id does not duplicate (same reference)', () => {
    const s = [wusong, linchong];
    expect(add(s, linchong)).toBe(s);
  });

  it('SEL-5 remove keeps the order of the rest', () => {
    expect(remove([songjiang, linchong, wusong], linchong)).toEqual([songjiang, wusong]);
  });

  it('SEL-6 remove a non-selected id returns the same reference', () => {
    const s = [wusong];
    expect(remove(s, linchong)).toBe(s);
  });

  it('SEL-7 clear returns an empty selection', () => {
    expect(clear()).toEqual([]);
  });

  it('SEL-8 only returns just that character', () => {
    expect(only(linchong)).toEqual([linchong]);
  });

  it('SEL-9 toggle twice returns to the original selection', () => {
    expect(toggle(toggle([wusong], linchong), linchong)).toEqual([wusong]);
  });
});

describe('groupToggle (G-7)', () => {
  it('GRP-1 AC-P9 天罡 on empty selects 17 members without 晁蓋', () => {
    expect(TG).toHaveLength(17);
    const next = groupToggle([], TG);
    expect(next).toHaveLength(17);
    expect(next).toEqual(TG);
    expect(next).not.toContain(chaogai);
  });

  it('GRP-2 AC-P10 天罡 again when all selected clears them', () => {
    expect(groupToggle(groupToggle([], TG), TG)).toEqual([]);
  });

  it('GRP-3 AC-S7 地煞 selects only 地煞 members; again clears', () => {
    const next = groupToggle([], DS);
    expect(next).toEqual(DS);
    const byId = realDataset.characterById;
    expect(next.every((id) => byId.get(id)?.group === '地煞')).toBe(true);
    expect(next).not.toContain(chaogai);
    expect(next).not.toContain(idOf('高俅'));
    expect(groupToggle(next, DS)).toEqual([]);
  });

  it('GRP-4 partially selected group adds the missing members only (keeps order)', () => {
    const next = groupToggle([wusong, linchong], TG);
    expect(next.slice(0, 2)).toEqual([wusong, linchong]);
    expect(next).toHaveLength(17);
    expect(new Set(next)).toEqual(new Set(TG));
  });

  it('GRP-5 AC-S8 晁蓋 + 天罡 = 18, 晁蓋 kept first', () => {
    const next = groupToggle([chaogai], TG);
    expect(next).toHaveLength(18);
    expect(next[0]).toBe(chaogai);
  });

  it('GRP-6 AC-S9 天罡 again keeps only 晁蓋', () => {
    expect(groupToggle(groupToggle([chaogai], TG), TG)).toEqual([chaogai]);
  });
});

describe('purity', () => {
  it('PURE-1 does not mutate inputs', () => {
    const s = [chaogai, wusong];
    const m = [...TG];
    const snap = [...s];
    toggle(s, linchong);
    add(s, linchong);
    remove(s, wusong);
    groupToggle(s, m);
    expect(s).toEqual(snap);
    expect(m).toEqual(TG);
  });
});
