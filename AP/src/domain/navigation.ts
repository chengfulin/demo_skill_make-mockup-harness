/**
 * 事件明細的上一個／下一個（FR-012、G-2；Prototype `openEvent` 的 prev／next）。
 * 事件在目前篩選結果中 → 依篩選結果順序；否則（例如從角色資料點進）→ 依全書事件順序。
 * 純函式，不依賴 React。
 */
import type { StoryEvent } from './types';

export interface PrevNext {
  /** 前一事件；已是第一個為 null */
  prev: StoryEvent | null;
  /** 後一事件；已是最後一個為 null */
  next: StoryEvent | null;
}

/**
 * @param id 目前事件 id
 * @param filtered 目前篩選結果（全書順序的子序列）
 * @param all 全書順序的全部事件
 */
export function prevNext(
  id: string,
  filtered: readonly StoryEvent[],
  all: readonly StoryEvent[],
): PrevNext {
  const list = filtered.some((e) => e.id === id) ? filtered : all;
  const i = list.findIndex((e) => e.id === id);
  if (i < 0) return { prev: null, next: null };
  return { prev: list[i - 1] ?? null, next: list[i + 1] ?? null };
}
