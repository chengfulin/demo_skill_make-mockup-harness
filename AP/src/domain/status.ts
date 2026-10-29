/**
 * 角色狀態推算（data-model.md §5「角色狀態」、§6 狀態轉換；FR-013、D-2；Prototype `status(c, ch)`）。
 *
 * 狀態只依章回單向前進：未登場 → 在野 → 已上梁山 → 已死亡或離散；未上梁山者跳過「已上梁山」；
 * 有結局回即從該回起為「已死亡或離散」（含離開未死者，D-2）；無結局回者停在最後狀態（高俅全書在野）。
 * 純函式，不修改輸入。
 */
import type { Character, CharacterStatus } from './types';

/** 全書回數（狀態條 1–120 回）。 */
export const CHAPTER_COUNT = 120;

/** 推算所需的角色欄位。 */
export type StatusInput = Pick<Character, 'firstChapter' | 'joinChapter' | 'fateChapter'>;

/** 連續同狀態的章回區段（含起訖回）。 */
export interface StatusSegment {
  status: CharacterStatus;
  from: number;
  to: number;
  /** 回數 = to − from + 1 */
  count: number;
}

/** 狀態條上方的節點標記。 */
export type MilestoneLabel = '登場' | '上梁山' | '結局';

export interface Milestone {
  label: MilestoneLabel;
  chapter: number;
}

/** 第 n 回的狀態（優先序：已死亡或離散 → 已上梁山 → 在野 → 未登場）。 */
export function statusAt(c: StatusInput, n: number): CharacterStatus {
  if (c.fateChapter !== null && n >= c.fateChapter) return '已死亡或離散';
  if (c.joinChapter !== null && n >= c.joinChapter) return '已上梁山';
  if (n >= c.firstChapter) return '在野';
  return '未登場';
}

/** 把 1–120 回依序合併成連續同狀態區段（回數總和恆為 120）。 */
export function statusSegments(c: StatusInput): StatusSegment[] {
  const segments: StatusSegment[] = [];
  for (let n = 1; n <= CHAPTER_COUNT; n++) {
    const status = statusAt(c, n);
    const last = segments[segments.length - 1];
    if (last && last.status === status) {
      last.to = n;
      last.count += 1;
    } else {
      segments.push({ status, from: n, to: n, count: 1 });
    }
  }
  return segments;
}

/** 登場／上梁山／結局 三節點（依此順序；值為 null 者不產生）。 */
export function milestones(c: StatusInput): Milestone[] {
  const all: [MilestoneLabel, number | null][] = [
    ['登場', c.firstChapter],
    ['上梁山', c.joinChapter],
    ['結局', c.fateChapter],
  ];
  return all.filter((m): m is [MilestoneLabel, number] => m[1] !== null).map(([label, chapter]) => ({ label, chapter }));
}

/** 狀態條 `aria-label`：「未登場 13 回，在野 6 回，已上梁山 40 回，已死亡或離散 61 回」。 */
export function statusAriaLabel(segments: readonly StatusSegment[]): string {
  return segments.map((s) => `${s.status} ${s.count} 回`).join('，');
}
