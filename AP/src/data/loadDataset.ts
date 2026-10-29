/**
 * 資料存取層（plan「資料存取層」；data-model.md §4；FR-021、FR-022）。
 *
 * 執行期資料只經本檔取得：`loadDataset(baseUrl)` 以 `Promise.all` 讀 6 個 JSON →
 * `validateDataset` → `buildIndex`。任一步失敗即整體 reject，不提供部分資料；
 * 失敗細節只寫 console，丟出通用錯誤。
 */
import type {
  Character,
  Dataset,
  RawDataset,
  RelationType,
  StoryEvent,
} from '../domain/types';
import { validateDataset } from './validateDataset';

const ENTITIES = ['arcs', 'chapters', 'characters', 'events', 'places', 'relations'] as const;

/** 對外丟出的通用錯誤訊息（細節只進 console）。 */
export const LOAD_ERROR_MESSAGE = '資料載入失敗';

/** 依起始回、再依迄回排序（穩定排序，同起訖保留原順序）。 */
function byBookOrder(a: StoryEvent, b: StoryEvent): number {
  return a.chapters[0] - b.chapters[0] || a.chapters[1] - b.chapters[1];
}

/** 由原始資料建立執行期索引（純函式，不修改輸入）。 */
export function buildIndex(raw: RawDataset): Dataset {
  const events = [...raw.events].sort(byBookOrder);

  const eventsByCharacter = new Map<string, StoryEvent[]>(
    raw.characters.map((c: Character) => [c.id, []]),
  );
  for (const ev of events) {
    for (const cid of ev.characters) {
      const list = eventsByCharacter.get(cid);
      if (list) list.push(ev);
      else eventsByCharacter.set(cid, [ev]);
    }
  }

  const neighbors = new Map<string, Set<string>>(raw.characters.map((c) => [c.id, new Set()]));
  const link = (from: string, to: string) => {
    const set = neighbors.get(from);
    if (set) set.add(to);
    else neighbors.set(from, new Set([to]));
  };
  const relationTypesPresent: RelationType[] = [];
  for (const rel of raw.relations) {
    link(rel.a, rel.b);
    link(rel.b, rel.a);
    if (!relationTypesPresent.includes(rel.type)) relationTypesPresent.push(rel.type);
  }

  return {
    arcs: raw.arcs,
    chapters: raw.chapters,
    characters: raw.characters,
    places: raw.places,
    relations: raw.relations,
    events,
    eventById: new Map(raw.events.map((e) => [e.id, e])),
    characterById: new Map(raw.characters.map((c) => [c.id, c])),
    arcById: new Map(raw.arcs.map((a) => [a.id, a])),
    placeById: new Map(raw.places.map((p) => [p.id, p])),
    chapterByNo: new Map(raw.chapters.map((c) => [c.no, c])),
    eventsByCharacter,
    neighbors,
    relationTypesPresent,
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  try {
    return await res.json();
  } catch (cause) {
    throw new Error(`JSON 解析失敗 ${url}`, { cause });
  }
}

/** 讀 `${baseUrl}<實體>.json`（6 檔）並驗證、建索引；失敗丟出通用錯誤。 */
export async function loadDataset(baseUrl: string): Promise<Dataset> {
  let raw: RawDataset;
  try {
    const parts = await Promise.all(ENTITIES.map((e) => fetchJson(`${baseUrl}${e}.json`)));
    raw = Object.fromEntries(ENTITIES.map((e, i) => [e, parts[i]])) as unknown as RawDataset;
  } catch (error) {
    console.error('[loadDataset] 讀取資料檔失敗', error);
    throw new Error(LOAD_ERROR_MESSAGE);
  }

  const result = validateDataset(raw);
  if (!result.ok) {
    console.error('[loadDataset] 資料驗證失敗\n' + result.errors.join('\n'));
    throw new Error(LOAD_ERROR_MESSAGE);
  }
  return buildIndex(raw);
}
