/**
 * 真實資料測試工具（T020；research R6：AC 數字當 oracle）。
 *
 * 以 node `fs` 讀 `AP/public/data/*.json`（由 `npm run data:convert` 自 Prototype 轉出並 commit），
 * 經 `buildIndex` 建成 `Dataset`，供 domain／state／元件測試共用。
 * 只在測試中使用；執行期資料一律經 `src/data/loadDataset` 載入（FR-021）。
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex } from '../data/loadDataset';
import type { Dataset, RawDataset } from '../domain/types';

const ENTITIES = ['arcs', 'chapters', 'characters', 'events', 'places', 'relations'] as const;

// 不用 `new URL(rel, import.meta.url)`：jsdom 環境的全域 URL 會把相對路徑解析到 http://localhost。
const DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/data');

function readEntity(entity: (typeof ENTITIES)[number]): unknown {
  const path = resolve(DATA_DIR, `${entity}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** 讀出 6 個資料檔的原始內容（每次呼叫回傳全新物件）。 */
export function loadRealRawDataset(): RawDataset {
  return Object.fromEntries(ENTITIES.map((e) => [e, readEntity(e)])) as unknown as RawDataset;
}

/** 以真實資料建立的 `Dataset`（模組載入時建立一次，測試勿修改）。 */
export const realDataset: Dataset = buildIndex(loadRealRawDataset());

/** 依姓名取角色 id（測試以姓名描述 AC，較易讀）；找不到即拋錯。 */
export function idOf(name: string): string {
  const c = realDataset.characters.find((ch) => ch.name === name);
  if (!c) throw new Error(`realDataset 找不到角色：${name}`);
  return c.id;
}

/** 依大節名取大節 id；找不到即拋錯。 */
export function arcIdOf(name: string): string {
  const a = realDataset.arcs.find((arc) => arc.name === name);
  if (!a) throw new Error(`realDataset 找不到大節：${name}`);
  return a.id;
}
