/**
 * 資料存取層 loadDataset／buildIndex（T018；data-model.md §4；plan「資料存取層」；FR-021、FR-022）
 *
 * loadDataset(baseUrl)：以 `Promise.all` 讀 `${baseUrl}<實體>.json`（6 檔）→ validateDataset → buildIndex。
 * 任一檔 HTTP 失敗、JSON 解析失敗、fetch 本身失敗或驗證失敗 → 整體 reject，不回傳部分資料；
 * 失敗細節只寫 console，丟出的錯誤為通用訊息（不含驗證細節）。
 * buildIndex(raw)：events 依起始回、再依迄回排序（同起訖保留原順序）；5 個對照表；
 * eventsByCharacter 依全書順序；neighbors 雙向；relationTypesPresent 依關係首次出現順序。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：6 檔皆 HTTP 200、內容為 `makeRawDataset()` 合成資料（通過 V1～V7）→ resolve Dataset
 *
 * | 特徵                          | blocks（非 base 者各為一案）                                   | 對應案例    |
 * | :---------------------------- | :------------------------------------------------------------- | :---------- |
 * | L1 請求網址                   | `${baseUrl}<實體>.json` × 6（base）                            | LOAD-URL    |
 * | L2 HTTP 狀態                  | 全部 200／某一檔 404／某一檔 500                               | LOAD-H1～H2 |
 * | L3 回應內容可解析             | 皆可解析／某一檔 JSON 解析失敗                                 | LOAD-J1     |
 * | L4 網路層                     | 正常／fetch 本身 reject（離線）                                | LOAD-N1     |
 * | L5 驗證結果                   | 通過／validateDataset 失敗（筆數不符）                         | LOAD-V1     |
 * | B1 事件起訖回順序             | 原始已排序（真實資料）／起始回亂序／同起始回不同迄回／同起訖   | IDX-S1～S3  |
 * | B2 對照表                     | 5 個對照表大小與查找                                           | IDX-M1      |
 * | B3 角色參與事件               | 有參與（依全書順序）／未參與任何事件（空陣列）                 | IDX-E1～E2  |
 * | B4 關係鄰接                   | 有關係（a→b 與 b→a 皆可查）／無關係角色（空集合）              | IDX-R1～R2  |
 * | B5 出現的關係類型             | 依首次出現順序、去重                                           | IDX-T1      |
 *
 * 範圍外（一次性宣告）：fetch 逾時與重試（重試由 DatasetProvider 負責，T031）；
 * 欄位層級的型別錯誤（validateDataset 只防禦非陣列，見 validateDataset.test.ts）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRawDataset } from '../test-utils/rawDatasetFactory';
import type { RawDataset, StoryEvent } from '../domain/types';
import { buildIndex, loadDataset } from './loadDataset';

const BASE = 'https://example.test/data/';
const ENTITIES = ['arcs', 'chapters', 'characters', 'events', 'places', 'relations'] as const;
type Entity = (typeof ENTITIES)[number];

type Override = { status?: number; body?: string; reject?: boolean };

/** 以 raw 建立 fetch stub；overrides 可讓特定實體回傳錯誤狀態、壞 JSON 或 reject。 */
function stubFetch(raw: RawDataset, overrides: Partial<Record<Entity, Override>> = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const entity = ENTITIES.find((e) => url === `${BASE}${e}.json`);
    if (!entity) return new Response('not found', { status: 404 });
    const o = overrides[entity] ?? {};
    if (o.reject) throw new TypeError('Failed to fetch');
    const body = o.body ?? JSON.stringify(raw[entity]);
    return new Response(body, {
      status: o.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('loadDataset', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    consoleError.mockRestore();
  });

  it('BASE resolves a Dataset when all 6 files succeed', async () => {
    const raw = makeRawDataset();
    stubFetch(raw);
    const ds = await loadDataset(BASE);
    expect(ds.arcs).toHaveLength(12);
    expect(ds.chapters).toHaveLength(120);
    expect(ds.characters).toHaveLength(22);
    expect(ds.events).toHaveLength(54);
    expect(ds.places).toHaveLength(32);
    expect(ds.relations).toHaveLength(13);
    expect(ds.eventById.get('ev-01')?.title).toBe('事件1');
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('LOAD-URL requests each of the 6 entity files under baseUrl', async () => {
    const fetchMock = stubFetch(makeRawDataset());
    await loadDataset(BASE);
    const urls = fetchMock.mock.calls.map(([input]) => String(input)).sort();
    expect(urls).toEqual(ENTITIES.map((e) => `${BASE}${e}.json`).sort());
  });

  // 失敗案例：整體 reject、不回傳部分資料、細節只進 console、錯誤訊息為通用文字
  const failureCases: [string, Partial<Record<Entity, Override>>, RawDataset?][] = [
    ['LOAD-H1 one file returns HTTP 404', { places: { status: 404, body: 'missing' } }],
    ['LOAD-H2 one file returns HTTP 500', { events: { status: 500, body: 'oops' } }],
    ['LOAD-J1 one file has malformed JSON', { relations: { body: '[{"a":' } }],
    ['LOAD-N1 fetch itself rejects', { arcs: { reject: true } }],
  ];

  it.each(failureCases)('%s rejects as a whole', async (_name, overrides) => {
    stubFetch(makeRawDataset(), overrides);
    await expect(loadDataset(BASE)).rejects.toBeInstanceOf(Error);
    expect(consoleError).toHaveBeenCalled();
  });

  it('LOAD-V1 validation failure rejects with a generic error (details only in console)', async () => {
    const raw = makeRawDataset();
    raw.characters.pop(); // V1 角色筆數 21
    stubFetch(raw);
    const error = await loadDataset(BASE).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toMatch(/V1/);
    const logged = consoleError.mock.calls.flat().map(String).join('\n');
    expect(logged).toMatch(/V1/);
  });
});

describe('buildIndex', () => {
  it('IDX-S1 sorts events by start chapter, then end chapter', () => {
    const raw = makeRawDataset(); // 合成事件依大節輪替，原始順序非全書順序
    const ds = buildIndex(raw);
    const starts = ds.events.map((e) => e.chapters);
    for (let i = 1; i < starts.length; i++) {
      const [ps, pe] = starts[i - 1];
      const [s, e] = starts[i];
      expect(ps < s || (ps === s && pe <= e)).toBe(true);
    }
    expect(ds.events[0].chapters[0]).toBe(1);
    expect(ds.events.at(-1)?.chapters[0]).toBe(111);
  });

  it('IDX-S2 same start chapter orders by end chapter', () => {
    const raw = makeRawDataset();
    // ev-01、ev-13 原為 [1,2]；把 ev-01 改為 [1,5]，ev-13 改為 [1,1]
    raw.events[0].chapters = [1, 5];
    raw.events[12].chapters = [1, 1];
    const ids = buildIndex(raw).events.slice(0, 5).map((e) => e.id);
    expect(ids.indexOf('ev-13')).toBeLessThan(ids.indexOf('ev-01'));
  });

  it('IDX-S3 identical chapter ranges keep original order (stable)', () => {
    const raw = makeRawDataset();
    // ev-01、ev-13、ev-25、ev-37、ev-49 皆為 [1,2]
    const ids = buildIndex(raw).events.filter((e) => e.chapters[0] === 1).map((e) => e.id);
    expect(ids).toEqual(['ev-01', 'ev-13', 'ev-25', 'ev-37', 'ev-49']);
  });

  it('IDX-S0 does not mutate the raw events array', () => {
    const raw = makeRawDataset();
    const before = raw.events.map((e) => e.id);
    buildIndex(raw);
    expect(raw.events.map((e) => e.id)).toEqual(before);
  });

  it('IDX-M1 builds the 5 lookup maps', () => {
    const raw = makeRawDataset();
    const ds = buildIndex(raw);
    expect(ds.eventById.size).toBe(54);
    expect(ds.characterById.size).toBe(22);
    expect(ds.arcById.size).toBe(12);
    expect(ds.placeById.size).toBe(32);
    expect(ds.chapterByNo.size).toBe(120);
    expect(ds.eventById.get('ev-54')).toBe(raw.events[53]);
    expect(ds.characterById.get('c05')?.name).toBe('角色5');
    expect(ds.arcById.get('arc-12')?.chapters).toEqual([111, 120]);
    expect(ds.placeById.get('地點3')?.lon).toBeCloseTo(110.6);
    expect(ds.chapterByNo.get(120)?.title).toBe('回目120');
  });

  it('IDX-E1 eventsByCharacter lists events in book order', () => {
    const raw = makeRawDataset();
    const ds = buildIndex(raw);
    const evs = ds.eventsByCharacter.get('c01') as readonly StoryEvent[];
    const expected = ds.events.filter((e) => e.characters.includes('c01'));
    expect(expected.length).toBeGreaterThan(0);
    expect(evs.map((e) => e.id)).toEqual(expected.map((e) => e.id));
  });

  it('IDX-E2 character with no events maps to an empty list', () => {
    const raw = makeRawDataset();
    for (const ev of raw.events) ev.characters = ev.characters.filter((c) => c !== 'c21');
    const ds = buildIndex(raw);
    expect(ds.eventsByCharacter.get('c21') ?? []).toEqual([]);
  });

  it('IDX-R1 neighbors are bidirectional', () => {
    const raw = makeRawDataset(); // 關係 c00–c01、c01–c02、…、c12–c13
    const ds = buildIndex(raw);
    expect([...(ds.neighbors.get('c01') ?? [])].sort()).toEqual(['c00', 'c02']);
    expect([...(ds.neighbors.get('c00') ?? [])]).toEqual(['c01']);
    expect([...(ds.neighbors.get('c13') ?? [])]).toEqual(['c12']);
  });

  it('IDX-R2 character without relations has no neighbors', () => {
    const ds = buildIndex(makeRawDataset());
    expect(ds.neighbors.get('c20')?.size ?? 0).toBe(0);
  });

  it('IDX-T1 relationTypesPresent follows first-appearance order without duplicates', () => {
    const raw = makeRawDataset();
    const types = ['仇敵', '結義', '仇敵', '夫妻', '結義', '仇敵', '夫妻', '結義', '仇敵', '結義', '夫妻', '仇敵', '結義'] as const;
    raw.relations.forEach((r, i) => {
      r.type = types[i];
    });
    expect(buildIndex(raw).relationTypesPresent).toEqual(['仇敵', '結義', '夫妻']);
  });
});
