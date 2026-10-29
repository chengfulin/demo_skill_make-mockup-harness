#!/usr/bin/env node
/**
 * 一次性轉換：Prototype v2 內嵌假資料 → AP/public/data/*.json（data-model.md §2）。
 *
 * 1. 讀 `.specify/context/shuihu-timeline/v2/prototype/index.html`（唯讀），sha256 不符即中止。
 * 2. 以正規表示式取出 `const DATA = {…};` 物件字面值後 JSON.parse；不執行 Prototype 其他程式碼。
 * 3. 正規化（章回 label／title、綽號、缺欄 → null、丟棄 fateNote、頭像字、事件地點）。
 * 4. 依實體各寫一檔，2 空白縮排，保留 Prototype 原順序。
 * 5. 呼叫與執行期相同的 validateDataset，失敗即非零結束（驗證失敗時不寫檔）。
 *
 * 用法：`npm run data:convert`（於 AP/ 執行）；可加 `--out <目錄>` 改寫到其他位置（試跑用）。
 * 需要 Node 24（原生型別剝除，直接 import validateDataset.ts）。
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDataset } from '../src/data/validateDataset.ts';

const PROTOTYPE_PATH = fileURLToPath(
  new URL('../../.specify/context/shuihu-timeline/v2/prototype/index.html', import.meta.url),
);
const PROTOTYPE_SHA256 = '1df5b8df97ce5aefd3304a18ef277e573f5825bab78ca514a8053eb229b8e48c';
const DEFAULT_OUT_DIR = fileURLToPath(new URL('../public/data/', import.meta.url));

/** Prototype `AVCH` 的頭像字覆寫（其餘角色取姓名首字）。 */
const AVATAR_OVERRIDES = { ruanxiaoer: '二', ruanxiaoqi: '七', yangzhi: '志', yangxiong: '雄' };

const ENTITIES = ['arcs', 'chapters', 'characters', 'events', 'places', 'relations'];

function fail(message) {
  console.error(`[convert-prototype-data] ${message}`);
  process.exit(1);
}

function parseOutDir(argv) {
  const i = argv.indexOf('--out');
  if (i === -1) return DEFAULT_OUT_DIR;
  const dir = argv[i + 1];
  if (!dir) fail('--out 需要一個目錄參數');
  return resolve(dir);
}

const orNull = (v) => (v === undefined || v === null ? null : v);

function normalizeChapter(ch) {
  const match = /^(\S+)\s+(.+)$/.exec(ch.title);
  if (!match) fail(`章回 ${ch.no} 的回目無法以空白切出回次與回目：${ch.title}`);
  return { no: ch.no, label: match[1], title: match[2] };
}

function splitNicknames(nickname) {
  if (!nickname) return [];
  const seat = /（座次綽號：([^）]+)）/.exec(nickname);
  const main = nickname.replace(/（座次綽號：[^）]+）/, '').trim();
  return [main, ...(seat ? [seat[1].trim()] : [])].filter(Boolean);
}

function normalizeCharacter(c) {
  const nickname = c.nickname ? c.nickname : null;
  return {
    id: c.id,
    name: c.name,
    nickname,
    nicknames: splitNicknames(nickname),
    group: c.group,
    star: orNull(c.star),
    rank: orNull(c.rank),
    firstChapter: c.firstChapter,
    joinChapter: orNull(c.joinChapter),
    fateChapter: orNull(c.fateChapter),
    fate: c.fate,
    avatar: AVATAR_OVERRIDES[c.id] ?? c.name[0],
    // fateNote 為 Prototype 註記（僅高俅有），屬說明非資料，丟棄
  };
}

function normalizeEvent(e) {
  return {
    id: e.id,
    title: e.title,
    chapters: [e.chapters[0], e.chapters[1]],
    arc: e.arc,
    location: e.location,
    place: e.place === undefined || e.place === null || e.place === '' ? null : e.place,
    characters: [...e.characters],
    summary: e.summary,
  };
}

function main() {
  const outDir = parseOutDir(process.argv.slice(2));

  // 1. 讀檔並比對 sha256
  const buffer = readFileSync(PROTOTYPE_PATH);
  const digest = createHash('sha256').update(buffer).digest('hex');
  if (digest !== PROTOTYPE_SHA256) {
    fail(`Prototype sha256 不符：預期 ${PROTOTYPE_SHA256}，實得 ${digest}`);
  }

  // 2. 取出 DATA 物件字面值（Prototype 的 DATA 是合法 JSON）
  const match = /^\s*const DATA = (\{.*\});\s*$/m.exec(buffer.toString('utf8'));
  if (!match) fail('找不到 `const DATA = {…};`');
  let data;
  try {
    data = JSON.parse(match[1]);
  } catch (err) {
    fail(`DATA 不是合法 JSON：${err.message}`);
  }
  for (const key of ENTITIES) {
    if (!Array.isArray(data[key])) fail(`DATA.${key} 不是陣列`);
  }

  // 3. 正規化（順序保留）
  const dataset = {
    arcs: data.arcs.map((a) => ({ id: a.id, name: a.name, chapters: [a.chapters[0], a.chapters[1]] })),
    chapters: data.chapters.map(normalizeChapter),
    characters: data.characters.map(normalizeCharacter),
    events: data.events.map(normalizeEvent),
    places: data.places.map((p) => ({ id: p.id, name: p.name, lon: p.lon, lat: p.lat })),
    relations: data.relations.map((r) => ({ a: r.a, b: r.b, type: r.type, note: r.note })),
  };

  // 5. 驗證（先驗後寫，失敗不留下部分檔案）
  const result = validateDataset(dataset);
  if (!result.ok) fail(`validateDataset 失敗：\n  ${result.errors.join('\n  ')}`);

  // 4. 寫檔
  mkdirSync(outDir, { recursive: true });
  for (const key of ENTITIES) {
    writeFileSync(resolve(outDir, `${key}.json`), `${JSON.stringify(dataset[key], null, 2)}\n`, 'utf8');
  }
  console.log(
    `[convert-prototype-data] 已寫出 ${ENTITIES.map((k) => `${k} ${dataset[k].length}`).join('、')} → ${outDir}`,
  );
}

main();
