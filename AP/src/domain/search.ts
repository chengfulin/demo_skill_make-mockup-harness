/**
 * 角色搜尋純函式（data-model.md §5「搜尋」；FR-009、D-3、D-5）。
 */
import type { Character } from './types';

/**
 * 即打即篩：q 去頭尾空白後為空 → 全部；否則 `name` 或 `nicknames` 任一包含 q 者，保留輸入順序。
 * 只比對綽號清單，不比對 `nickname` 顯示字串中的說明字（D-5）。
 */
export function matchCharacters(characters: readonly Character[], q: string): Character[] {
  const query = q.trim();
  if (query === '') return [...characters];
  return characters.filter((c) => c.name.includes(query) || c.nicknames.some((n) => n.includes(query)));
}

/**
 * 搜尋框按 Enter 要選取的角色：第一個符合者且未被選取 → 其 id；
 * 已選或無符合 → null（D-3：只選取、不取消）。
 */
export function enterSelectTarget(matches: readonly Character[], selected: readonly string[]): string | null {
  const first = matches[0];
  if (!first || selected.includes(first.id)) return null;
  return first.id;
}
