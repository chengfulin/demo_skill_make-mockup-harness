/**
 * 篩選純函式（data-model.md §5；FR-003、G-9）。
 */
import type { StoryEvent } from './types';

/**
 * 篩選事件：「(arcId 為空 或 e.arc = arcId) 且 (selected 為空 或 e.characters ∩ selected ≠ ∅)」。
 * 保留輸入順序（呼叫端傳入全書順序的 `dataset.events`）。
 */
export function filterEvents(
  events: readonly StoryEvent[],
  selected: readonly string[],
  arcId: string | null,
): StoryEvent[] {
  const sel = new Set(selected);
  return events.filter(
    (e) =>
      (arcId === null || e.arc === arcId) &&
      (sel.size === 0 || e.characters.some((cid) => sel.has(cid))),
  );
}

/** 在該大節至少參與一個事件的角色 id 集合（G-9）；依首次出現順序迭代。 */
export function charactersInArc(events: readonly StoryEvent[], arcId: string): Set<string> {
  const result = new Set<string>();
  for (const e of events) {
    if (e.arc !== arcId) continue;
    for (const cid of e.characters) result.add(cid);
  }
  return result;
}
