/**
 * 章回區間與大節標籤文字（Prototype `rng`、大節選單、色帶、清單；AC-P15、AC-P18）。
 * 區間連接號為 en dash「–」（U+2013）。
 */
import type { Arc, ChapterRange } from './types';

const DASH = '–';

/** 明細用：「第 a–b 回」；單回「第 a 回」。 */
export function formatChapterRange([a, b]: ChapterRange): string {
  return a === b ? `第 ${a} 回` : `第 ${a}${DASH}${b} 回`;
}

/** 清單用：「a–b回」；單回「a回」。 */
export function formatChapterRangeShort([a, b]: ChapterRange): string {
  return a === b ? `${a}回` : `${a}${DASH}${b}回`;
}

/** 大節選項：「<大節名>（第 a–b 回）」（單回大節仍寫成 a–b）。 */
export function formatArcOption(arc: Arc): string {
  const [a, b] = arc.chapters;
  return `${arc.name}（第 ${a}${DASH}${b} 回）`;
}

/** 大節色帶：「a–b」（單回大節仍寫成 a–b）。 */
export function formatArcBand(arc: Arc): string {
  const [a, b] = arc.chapters;
  return `${a}${DASH}${b}`;
}
