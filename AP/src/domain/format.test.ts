/**
 * 章回區間與大節標籤文字 format（T022；Prototype `rng`、大節選單、色帶、清單；AC-P15、AC-P18）
 *
 * 介面（T026 依此實作）：
 *   formatChapterRange([a, b])       明細用：a≠b →「第 a–b 回」；a=b →「第 a 回」
 *   formatChapterRangeShort([a, b])  清單用：a≠b →「a–b回」；a=b →「a回」
 *   formatArcOption(arc)             大節選項：「<大節名>（第 a–b 回）」（a=b 仍寫成 a–b）
 *   formatArcBand(arc)               色帶：「a–b」（a=b 仍寫成 a–b）
 * 區間連接號為 en dash「–」（U+2013）。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：多回區間 [28, 31]
 *
 * | 特徵                   | blocks（非 base 者各為一案）              | 對應案例       |
 * | :--------------------- | :---------------------------------------- | :------------- |
 * | R1 區間長度            | 多回（base）／單回（a=b）                 | FMT-D2、FMT-S2 |
 * | R2 章回邊界值          | 中段（base）／首回 1／末回 120            | FMT-B1～B2     |
 * | O1 大節區間            | 多回（三打祝家莊 43–50）／單回（魂聚蓼兒洼 120–120） | FMT-A1～A2、FMT-C1～C2 |
 *
 * 範圍外（一次性宣告）：非法區間（a > b、超出 1–120）——資料由 validateDataset（V2、V3）把關。
 */
import { describe, expect, it } from 'vitest';
import type { Arc } from './types';
import {
  formatArcBand,
  formatArcOption,
  formatChapterRange,
  formatChapterRangeShort,
} from './format';

const zhu: Arc = { id: 'arc-05', name: '三打祝家莊', chapters: [43, 50] };
const liao: Arc = { id: 'arc-12', name: '魂聚蓼兒洼', chapters: [120, 120] };

describe('formatChapterRange (detail)', () => {
  it('BASE multi-chapter range', () => {
    expect(formatChapterRange([28, 31])).toBe('第 28–31 回');
  });

  it('FMT-D2 single chapter', () => {
    expect(formatChapterRange([8, 8])).toBe('第 8 回');
  });

  it('FMT-B1 first and last chapters', () => {
    expect(formatChapterRange([1, 1])).toBe('第 1 回');
    expect(formatChapterRange([1, 120])).toBe('第 1–120 回');
  });
});

describe('formatChapterRangeShort (list)', () => {
  it('BASE multi-chapter range', () => {
    expect(formatChapterRangeShort([28, 31])).toBe('28–31回');
  });

  it('FMT-S2 single chapter', () => {
    expect(formatChapterRangeShort([8, 8])).toBe('8回');
  });

  it('FMT-B2 last chapter', () => {
    expect(formatChapterRangeShort([120, 120])).toBe('120回');
  });
});

describe('formatArcOption', () => {
  it('FMT-A1 multi-chapter arc', () => {
    expect(formatArcOption(zhu)).toBe('三打祝家莊（第 43–50 回）');
  });

  it('FMT-A2 single-chapter arc keeps a–b form', () => {
    expect(formatArcOption(liao)).toBe('魂聚蓼兒洼（第 120–120 回）');
  });
});

describe('formatArcBand', () => {
  it('FMT-C1 multi-chapter arc', () => {
    expect(formatArcBand(zhu)).toBe('43–50');
  });

  it('FMT-C2 single-chapter arc keeps a–b form', () => {
    expect(formatArcBand(liao)).toBe('120–120');
  });
});
