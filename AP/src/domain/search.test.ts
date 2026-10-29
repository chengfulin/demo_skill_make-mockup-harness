/**
 * 角色搜尋純函式（T061；data-model.md §5「搜尋」；FR-009、D-3、D-5）
 *
 * 介面（T066 依此實作）：
 *   matchCharacters(characters, q) → Character[]
 *     q 去頭尾空白後為空 → 全部（同一順序）；否則 `name` 或 `nicknames` 任一包含 q 者，保留輸入順序。
 *     不比對 `nickname` 顯示字串（含「座次綽號」等說明字，D-5）。
 *   enterSelectTarget(matches, selected) → string | null
 *     matches[0] 存在且未在 selected → 其 id；已選或無符合 → null（D-3：Enter 只選取、不取消）。
 * Oracle：真實資料（realDataset）的 AC。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：q=「豹子頭」（綽號第一個，唯一符合 → 林沖）
 *
 * | 特徵                        | blocks（非 base 者各為一案）                                       | 對應案例     |
 * | :-------------------------- | :----------------------------------------------------------------- | :----------- |
 * | Q1 q 命中欄位               | 主綽號（base）／姓名／第二綽號（呼保義）／無（孫悟空）／說明字（座次） | SRC-1～SRC-5 |
 * | Q2 q 形態                   | 一般（base）／空字串／只有空白／部分字（多人符合，順序同資料）     | SRC-6～SRC-8 |
 * | E1 第一個符合者選取狀態     | 未選／已選                                                         | ENT-1～ENT-2 |
 * | E2 符合數                   | ≥1／0                                                              | ENT-3        |
 *
 * 範圍外（一次性宣告）：大小寫與全半形正規化（資料全為中文）；注音／拼音輸入（不支援）。
 */
import { describe, expect, it } from 'vitest';
import { idOf, realDataset } from '../test-utils/realDataset';
import { enterSelectTarget, matchCharacters } from './search';

const { characters } = realDataset;
const names = (q: string) => matchCharacters(characters, q).map((c) => c.name);

describe('matchCharacters (D-5)', () => {
  it('BASE AC-P6 豹子頭 → 林沖 only', () => {
    expect(names('豹子頭')).toEqual(['林沖']);
  });

  it('SRC-1 AC-P7 黑旋風 → 李逵 only (not 小旋風 柴進)', () => {
    expect(names('黑旋風')).toEqual(['李逵']);
  });

  it('SRC-2 by name 武松', () => {
    expect(names('武松')).toEqual(['武松']);
  });

  it('SRC-3 AC-S21 second nickname 呼保義 → 宋江', () => {
    expect(names('呼保義')).toEqual(['宋江']);
  });

  it('SRC-4 AC-P8 孫悟空 → none', () => {
    expect(names('孫悟空')).toEqual([]);
  });

  it('SRC-5 AC-S21 explanatory text 座次 → none', () => {
    expect(names('座次')).toEqual([]);
    expect(names('綽號')).toEqual([]);
  });

  it('SRC-6 empty query → all characters in data order', () => {
    expect(matchCharacters(characters, '')).toEqual([...characters]);
  });

  it('SRC-7 whitespace-only query → all characters', () => {
    expect(matchCharacters(characters, '  ')).toHaveLength(characters.length);
  });

  it('SRC-8 partial text matching several keeps data order (旋風)', () => {
    expect(names('旋風')).toEqual(['李逵', '柴進']);
  });
});

describe('enterSelectTarget (D-3)', () => {
  it('ENT-1 AC-P34 first match not selected → its id', () => {
    expect(enterSelectTarget(matchCharacters(characters, '黑旋風'), [])).toBe(idOf('李逵'));
  });

  it('ENT-2 AC-S19 first match already selected → null', () => {
    expect(enterSelectTarget(matchCharacters(characters, '豹子頭'), [idOf('林沖')])).toBeNull();
  });

  it('ENT-3 AC-S19 no match → null', () => {
    expect(enterSelectTarget(matchCharacters(characters, '孫悟空'), [idOf('林沖')])).toBeNull();
  });

  it('ENT-4 only the first match is considered (second unselected is ignored)', () => {
    const matches = matchCharacters(characters, '旋風'); // 李逵、柴進
    expect(enterSelectTarget(matches, [idOf('李逵')])).toBeNull();
    expect(enterSelectTarget(matches, [idOf('柴進')])).toBe(idOf('李逵'));
  });
});
