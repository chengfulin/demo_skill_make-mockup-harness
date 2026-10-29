/**
 * 角色選取純函式（data-model.md §5「天罡／地煞快選」；FR-003、FR-010、G-7）。
 *
 * `selected` 為依加入順序的角色 id 陣列（已選標籤照此順序）。所有函式不修改輸入；
 * 沒有變化時回傳原陣列（同一參照），讓 reducer 可保持冪等。
 */

/** 未選→加到最後；已選→移除。 */
export function toggle(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? remove(selected, id) : [...selected, id];
}

/** 未選→加到最後；已選→原陣列（不重複）。 */
export function add(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? (selected as string[]) : [...selected, id];
}

/** 移除；不在其中→原陣列。 */
export function remove(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((s) => s !== id) : (selected as string[]);
}

/** 清空。 */
export function clear(): string[] {
  return [];
}

/** 只選這一位（US5「只看此角色」）。 */
export function only(id: string): string[] {
  return [id];
}

/**
 * 天罡／地煞快選（G-7）：
 * members 已全選 → 只移除 members（其他已選保留、順序不變）；
 * 否則 → 依 members 順序把未選者加到最後（保留既有選取）。
 */
export function groupToggle(selected: readonly string[], members: readonly string[]): string[] {
  const current = new Set(selected);
  const allSelected = members.every((id) => current.has(id));
  if (allSelected) {
    const drop = new Set(members);
    return selected.filter((id) => !drop.has(id));
  }
  return [...selected, ...members.filter((id) => !current.has(id))];
}
