/**
 * 資料驗證（data-model.md §3 V1～V7），執行期 `loadDataset` 與轉換腳本共用。
 *
 * 只用 `import type`、不 import 任何執行期模組，確保
 * `scripts/convert-prototype-data.mjs` 能以 Node 24 原生型別剝除直接 import 本檔。
 * 每條錯誤訊息以規則編號（V1…V7）加一個空白開頭。
 */
import type { RawDataset, RelationType } from '../domain/types.ts';

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

const FIRST_CHAPTER = 1;
const LAST_CHAPTER = 120;

const EXPECTED_COUNTS: Record<keyof RawDataset, number> = {
  arcs: 12,
  chapters: 120,
  characters: 22,
  events: 54,
  places: 32,
  relations: 13,
};

const RELATION_TYPES: readonly RelationType[] = ['結義', '師徒', '主僕', '仇敵', '夫妻', '兄弟'];

function findDuplicates(values: readonly unknown[]): unknown[] {
  const seen = new Set<unknown>();
  const dup = new Set<unknown>();
  for (const v of values) {
    if (seen.has(v)) dup.add(v);
    seen.add(v);
  }
  return [...dup];
}

export function validateDataset(raw: RawDataset): ValidationResult {
  const errors: string[] = [];

  // V1 筆數（同時防禦非陣列，避免後續規則拋例外）
  const keys = Object.keys(EXPECTED_COUNTS) as (keyof RawDataset)[];
  for (const key of keys) {
    const list: unknown = raw?.[key];
    if (!Array.isArray(list)) {
      errors.push(`V1 ${key} 不是陣列`);
    } else if (list.length !== EXPECTED_COUNTS[key]) {
      errors.push(`V1 ${key} 筆數 ${list.length}，應為 ${EXPECTED_COUNTS[key]}`);
    }
  }
  if (keys.some((key) => !Array.isArray(raw?.[key]))) {
    return { ok: false, errors };
  }

  const { arcs, chapters, characters, events, places, relations } = raw;

  // V7 id 唯一
  const idChecks: [string, unknown[]][] = [
    ['arcs.id', arcs.map((a) => a.id)],
    ['chapters.no', chapters.map((c) => c.no)],
    ['characters.id', characters.map((c) => c.id)],
    ['events.id', events.map((e) => e.id)],
    ['places.id', places.map((p) => p.id)],
  ];
  for (const [label, ids] of idChecks) {
    for (const dup of findDuplicates(ids)) errors.push(`V7 ${label} 重複：${String(dup)}`);
  }

  // V2 大節依序連續、不重疊，第一個起於 1、最後一個止於 120
  arcs.forEach((arc, i) => {
    const [start, end] = arc.chapters;
    if (start > end) errors.push(`V2 ${arc.id} 起回 ${start} 大於迄回 ${end}`);
    if (i === 0 && start !== FIRST_CHAPTER) {
      errors.push(`V2 第一個大節 ${arc.id} 起於第 ${start} 回，應起於第 ${FIRST_CHAPTER} 回`);
    }
    if (i > 0) {
      const prevEnd = arcs[i - 1].chapters[1];
      if (start !== prevEnd + 1) {
        errors.push(`V2 ${arc.id} 起於第 ${start} 回，未緊接前一大節（止於第 ${prevEnd} 回）`);
      }
    }
    if (i === arcs.length - 1 && end !== LAST_CHAPTER) {
      errors.push(`V2 最後一個大節 ${arc.id} 止於第 ${end} 回，應止於第 ${LAST_CHAPTER} 回`);
    }
  });

  const arcById = new Map(arcs.map((a) => [a.id, a]));
  const placeIds = new Set(places.map((p) => p.id));
  const characterIds = new Set(characters.map((c) => c.id));

  for (const ev of events) {
    const [start, end] = ev.chapters;
    // V3 1 ≤ 起回 ≤ 迄回 ≤ 120，且起回落在所屬大節範圍內（迄回可延伸到下一大節）
    if (!(FIRST_CHAPTER <= start && start <= end && end <= LAST_CHAPTER)) {
      errors.push(`V3 ${ev.id} 章回 [${start}, ${end}] 不符 1 ≤ 起回 ≤ 迄回 ≤ 120`);
    }
    const arc = arcById.get(ev.arc);
    if (arc && (start < arc.chapters[0] || start > arc.chapters[1])) {
      errors.push(
        `V3 ${ev.id} 起回 ${start} 不在所屬大節 ${arc.id} [${arc.chapters[0]}, ${arc.chapters[1]}] 內`,
      );
    }
    // V4 arc、place（非 null 時）、characters[*] 都存在
    if (!arc) errors.push(`V4 ${ev.id} 的大節 ${ev.arc} 不存在`);
    if (ev.place !== null && !placeIds.has(ev.place)) {
      errors.push(`V4 ${ev.id} 的地點 ${ev.place} 不存在`);
    }
    for (const cid of ev.characters) {
      if (!characterIds.has(cid)) errors.push(`V4 ${ev.id} 的角色 ${cid} 不存在`);
    }
  }

  // V5 關係兩端角色存在，且 type 為六種之一
  relations.forEach((rel, i) => {
    for (const end of [rel.a, rel.b]) {
      if (!characterIds.has(end)) errors.push(`V5 relations[${i}] 的角色 ${end} 不存在`);
    }
    if (!RELATION_TYPES.includes(rel.type)) {
      errors.push(`V5 relations[${i}] 的類型 ${String(rel.type)} 不在六種之內`);
    }
  });

  // V6 firstChapter ≤ joinChapter ≤ fateChapter（有值者）；群組與星號、座次
  for (const c of characters) {
    const seq = [c.firstChapter, c.joinChapter, c.fateChapter].filter(
      (n): n is number => n !== null,
    );
    if (seq.some((n, i) => i > 0 && seq[i - 1] > n)) {
      errors.push(
        `V6 ${c.id} 章回順序不符 firstChapter ≤ joinChapter ≤ fateChapter（${c.firstChapter}／${c.joinChapter}／${c.fateChapter}）`,
      );
    }
    if (c.group === '天罡' || c.group === '地煞') {
      if (c.star === null || c.rank === null) {
        errors.push(`V6 ${c.id} 屬${c.group}，star 與 rank 不得為 null`);
      }
    } else if (c.group === '其他') {
      if (c.star !== null || c.rank !== null) {
        errors.push(`V6 ${c.id} 屬其他，star 與 rank 須為 null`);
      }
    } else {
      errors.push(`V6 ${c.id} 的群組 ${String(c.group)} 不在天罡／地煞／其他之內`);
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
