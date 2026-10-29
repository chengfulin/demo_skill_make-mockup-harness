/**
 * 地圖版面（範圍部分）MAP_SCOPES／project／inScope（T023；Prototype `SCOPES`、`px`、`inScope`；AC-P36）
 *
 * 介面（T027 依此實作；US6 再擴充本檔）：
 *   MAP_SCOPES: Record<'all' | 'sd', { width, height, lon: [lon0, lon1], lat: [lat0, lat1], label }>
 *   project(scope, lon, lat) → { x, y }
 *     x = (lon − lon0) / (lon1 − lon0) · width；y = (lat1 − lat) / (lat1 − lat0) · height
 *   inScope(scope, place) → lon0 ≤ lon ≤ lon1 且 lat0 ≤ lat ≤ lat1（含邊界）
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：scope = 'all'
 *
 * | 特徵                 | blocks（非 base 者各為一案）                                 | 對應案例        |
 * | :------------------- | :----------------------------------------------------------- | :-------------- |
 * | S1 範圍              | all（base）／sd                                              | MAP-C1～C2      |
 * | P1 投影位置          | 左上角 (lon0, lat1)／右下角 (lon1, lat0)／中點／任一真實地點 | MAP-P1～P4      |
 * | I1 經度相對範圍      | 內／等於邊界／小於 lon0／大於 lon1                           | MAP-I1～I4      |
 * | I2 緯度相對範圍      | 內／等於邊界／小於 lat0／大於 lat1                           | MAP-I5～I7      |
 * | I3 真實資料          | 全圖含 32 地點／山東 15 地點且不含東京                       | MAP-R1～R2      |
 *
 * 範圍外（一次性宣告）：非數值經緯度（資料由轉換腳本產生）。
 *
 * ── US6 擴充（T114；FR-015～FR-018、G-3；AC-14、AC-16、AC-P26、AC-P27、AC-P28、AC-P37、AC-P38、AC-S10）──
 *
 * 介面（T119 依此實作）：
 *   buildMarkers(filtered, placeById, scope) → MapMarker[]
 *     { placeId, name, events, x, y, r, labelX, labelY, labelAnchor: 'start' | 'end' }
 *     只含篩選結果中 place≠null 且 inScope 的地點，順序＝地點首次出現順序；
 *     r = (山東 12｜全圖 9) + min(事件數, 8)·1.3；40 輪兩兩推開、間距 山東 6／全圖 2（只改顯示位置）；
 *     標籤靠右（labelX = x + r + 4，start），x > W − 90 改靠左（labelX = x − r − 4，end）；labelY = y + 4
 *   buildTrail(filtered, characterId) → placeId[]（place≠null、全書順序、連續同地點合併）
 *   projectTrail(placeIds, placeById, scope) → { points, steps: [{ x, y, n }] } | null（<2 點為 null；steps 為各段中點）
 *   unlocatedCount(filtered) → place 為 null 的事件數
 *   eventsAtPlace(filtered, placeId) → 該地點的篩選事件
 *   chapterPercent(n) → (n − 1) / 119 · 100；RULER_LABELS = [1, 30, 60, 90, 120]
 *
 * ISP 分割表（US6；Experimental → Base Choice）
 * Base：真實資料、篩選＝只選武松、scope = 'all'
 *
 * | 特徵                   | blocks（非 base 者各為一案）                                      | 對應案例         |
 * | :--------------------- | :---------------------------------------------------------------- | :--------------- |
 * | M1 篩選結果            | 只選武松（base）／未篩選／武松＋宋江（含無法定位）／空            | MK-1、MK-3、MK-4、MK-5 |
 * | M2 範圍                | all（base）／sd（範圍外地點排除）                                 | MK-2             |
 * | M3 事件數 → 半徑       | 1／3／>8（封頂）；山東基準 12                                     | MK-6             |
 * | M4 推開                | 無重疊（位置＝投影）／重疊（推開後間距 ≥ r+r+gap，只改顯示位置）  | MK-7、MK-8       |
 * | M5 標籤側別            | 靠右（base）／近右緣靠左                                          | MK-9             |
 * | M6 標籤重疊（AC-P37）  | 山東未篩選：標籤外框兩兩不相交                                     | MK-10            |
 * | T1 行跡角色事件        | 每點不同（base 武松 8 點）／連續同地點／中間夾無法定位／未參與    | TR-1～TR-4       |
 * | T2 行跡點數            | ≥2（有幾何）／1（null）／0（null）                                | TR-5、TR-6       |
 * | U1 無法定位事件        | 0（武松）／1（武松＋宋江）                                        | UL-1、UL-2       |
 * | P1 地點事件            | 篩選內（江州 3）／篩選外（0）                                     | EP-1、EP-2       |
 * | R1 刻度位置            | 第 1 回 0%／第 120 回 100%／中間                                  | RU-1             |
 *
 * 範圍外（一次性宣告）：實際字型量測（標籤外框以字級 × 字數估算；E2E 以 getBBox 驗 AC-P37）；
 * 全圖標籤重疊（spec 只要求山東範圍，Prototype 全圖亦有重疊）。
 */
import { describe, expect, it } from 'vitest';
import { idOf, realDataset } from '../test-utils/realDataset';
import { filterEvents } from './filter';
import type { Place, StoryEvent } from './types';
import {
  LABEL_FONT_SIZE,
  MAP_SCOPES,
  RULER_LABELS,
  buildMarkers,
  buildTrail,
  chapterPercent,
  eventsAtPlace,
  inScope,
  markerRadius,
  project,
  projectTrail,
  unlocatedCount,
  type MapMarker,
} from './mapLayout';

const at = (lon: number, lat: number): Place => ({ id: 'p', name: 'p', lon, lat });

describe('MAP_SCOPES', () => {
  it('MAP-C1 all: viewBox 860x700, lon 105-122.5, lat 27-41.5', () => {
    expect(MAP_SCOPES.all).toMatchObject({ width: 860, height: 700, lon: [105, 122.5], lat: [27, 41.5] });
  });

  it('MAP-C2 sd (Shandong): viewBox 860x620, lon 114.6-119.2, lat 34.6-37.9', () => {
    expect(MAP_SCOPES.sd).toMatchObject({
      width: 860,
      height: 620,
      lon: [114.6, 119.2],
      lat: [34.6, 37.9],
    });
  });
});

describe('project (equirectangular)', () => {
  it('MAP-P1 top-left corner maps to (0, 0)', () => {
    const p = project('all', 105, 41.5);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it('MAP-P2 bottom-right corner maps to (W, H)', () => {
    const all = project('all', 122.5, 27);
    expect(all.x).toBeCloseTo(860);
    expect(all.y).toBeCloseTo(700);
    const sd = project('sd', 119.2, 34.6);
    expect(sd.x).toBeCloseTo(860);
    expect(sd.y).toBeCloseTo(620);
  });

  it('MAP-P3 center maps to (W/2, H/2)', () => {
    const p = project('sd', (114.6 + 119.2) / 2, (34.6 + 37.9) / 2);
    expect(p.x).toBeCloseTo(430);
    expect(p.y).toBeCloseTo(310);
  });

  it('MAP-P4 follows x=(lon-lon0)/(lon1-lon0)*W, y=(lat1-lat)/(lat1-lat0)*H', () => {
    // 梁山泊 116.1, 35.8
    const all = project('all', 116.1, 35.8);
    expect(all.x).toBeCloseTo(((116.1 - 105) / (122.5 - 105)) * 860, 6);
    expect(all.y).toBeCloseTo(((41.5 - 35.8) / (41.5 - 27)) * 700, 6);
    const sd = project('sd', 116.1, 35.8);
    expect(sd.x).toBeCloseTo(((116.1 - 114.6) / (119.2 - 114.6)) * 860, 6);
    expect(sd.y).toBeCloseTo(((37.9 - 35.8) / (37.9 - 34.6)) * 620, 6);
  });
});

describe('inScope', () => {
  it('MAP-I1 inside', () => {
    expect(inScope('sd', at(116, 36))).toBe(true);
  });

  it('MAP-I2 on the boundary counts as inside', () => {
    expect(inScope('sd', at(114.6, 34.6))).toBe(true);
    expect(inScope('sd', at(119.2, 37.9))).toBe(true);
  });

  it('MAP-I3 lon below lon0', () => {
    expect(inScope('sd', at(114.5, 36))).toBe(false);
  });

  it('MAP-I4 lon above lon1', () => {
    expect(inScope('sd', at(119.3, 36))).toBe(false);
  });

  it('MAP-I5 lat below lat0', () => {
    expect(inScope('sd', at(116, 34.5))).toBe(false);
  });

  it('MAP-I6 lat above lat1', () => {
    expect(inScope('sd', at(116, 38))).toBe(false);
  });

  it('MAP-I7 all scope covers far points that sd excludes', () => {
    expect(inScope('all', at(106.7, 35.5))).toBe(true);
    expect(inScope('sd', at(106.7, 35.5))).toBe(false);
  });

  it('MAP-R1 all 32 real places are inside the full map', () => {
    expect(realDataset.places).toHaveLength(32);
    expect(realDataset.places.filter((p) => inScope('all', p))).toHaveLength(32);
  });

  it('MAP-R2 Shandong scope has 15 of 32 places and excludes 東京 (AC-P36)', () => {
    const sd = realDataset.places.filter((p) => inScope('sd', p));
    expect(sd).toHaveLength(15);
    expect(sd.map((p) => p.id)).not.toContain('東京');
  });
});

// ───────────────────────── US6（T114） ─────────────────────────

const { events: book, placeById } = realDataset;
const pick = (...names: string[]) => filterEvents(book, names.map(idOf), null);
const wusong = pick('武松');

/** 合成事件 */
const ev = (id: string, place: string | null, characters: string[] = ['x']): StoryEvent => ({
  id,
  title: id,
  chapters: [1, 1],
  arc: 'arc-01',
  location: place ?? '某處',
  place,
  characters,
  summary: '',
});
const placeMap = (...ps: Place[]) => new Map(ps.map((p) => [p.id, p]));
const P = (id: string, lon: number, lat: number): Place => ({ id, name: id, lon, lat });

describe('buildMarkers', () => {
  it('MK-1 (AC-14, AC-P26) Wu Song on the full map: 8 markers, one event each', () => {
    const m = buildMarkers(wusong, placeById, 'all');
    expect(m.map((x) => x.placeId)).toEqual(['滄州', '景陽岡', '陽穀縣', '孟州', '青州', '梁山泊', '睦州', '杭州']);
    expect(m.every((x) => x.events.length === 1)).toBe(true);
  });

  it('MK-2 (AC-P38) Wu Song in Shandong: 4 markers, out-of-scope places excluded', () => {
    const m = buildMarkers(wusong, placeById, 'sd');
    expect(m.map((x) => x.placeId).sort()).toEqual(['景陽岡', '梁山泊', '陽穀縣', '青州'].sort());
    expect(m.map((x) => x.placeId)).not.toContain('東京');
  });

  it('MK-3 (AC-P35, AC-P36) no filter: 32 markers on the full map, 15 in Shandong without 東京', () => {
    expect(buildMarkers(book, placeById, 'all')).toHaveLength(32);
    const sd = buildMarkers(book, placeById, 'sd');
    expect(sd).toHaveLength(15);
    expect(sd.map((x) => x.placeId)).not.toContain('東京');
  });

  it('MK-4 (AC-P27) unlocated events never become markers', () => {
    const m = buildMarkers(pick('武松', '宋江'), placeById, 'all');
    const total = m.reduce((n, x) => n + x.events.length, 0);
    expect(total).toBe(pick('武松', '宋江').length - 1);
  });

  it('MK-5 empty filter result gives no markers', () => {
    expect(buildMarkers([], placeById, 'all')).toEqual([]);
  });

  it('MK-6 radius = (sd 12 | all 9) + min(count, 8) * 1.3', () => {
    expect(markerRadius('all', 1)).toBeCloseTo(10.3);
    expect(markerRadius('all', 3)).toBeCloseTo(12.9);
    expect(markerRadius('all', 20)).toBeCloseTo(9 + 8 * 1.3);
    expect(markerRadius('sd', 1)).toBeCloseTo(13.3);
    const all = buildMarkers(book, placeById, 'all');
    const liang = all.find((x) => x.placeId === '梁山泊');
    expect(liang?.events).toHaveLength(7);
    expect(liang?.r).toBeCloseTo(9 + 7 * 1.3);
  });

  it('MK-7 far-apart markers stay at their projected position', () => {
    const places = placeMap(P('A', 106, 40), P('B', 121, 28));
    const m = buildMarkers([ev('e1', 'A'), ev('e2', 'B')], places, 'all');
    expect(m[0].x).toBeCloseTo(project('all', 106, 40).x);
    expect(m[0].y).toBeCloseTo(project('all', 106, 40).y);
    expect(m[1].x).toBeCloseTo(project('all', 121, 28).x);
  });

  it('MK-8 overlapping markers are pushed apart (gap all 2 / sd 6) without moving the place data', () => {
    const places = placeMap(P('A', 116, 36), P('B', 116.01, 36));
    for (const scope of ['all', 'sd'] as const) {
      const [a, b] = buildMarkers([ev('e1', 'A'), ev('e2', 'B')], places, scope);
      const gap = scope === 'sd' ? 6 : 2;
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(a.r + b.r + gap - 0.01);
    }
    expect(places.get('A')).toEqual(P('A', 116, 36));
    // 真實資料：推開後任兩個標記都不重疊
    for (const scope of ['all', 'sd'] as const) {
      const m = buildMarkers(book, placeById, scope);
      for (let i = 0; i < m.length; i++)
        for (let j = i + 1; j < m.length; j++)
          expect(Math.hypot(m[j].x - m[i].x, m[j].y - m[i].y)).toBeGreaterThan(m[i].r + m[j].r - 0.5);
    }
  });

  it('MK-9 label sits right of the circle, flips left near the right edge (x > W - 90)', () => {
    const places = placeMap(P('W', 106, 35), P('E', 122.3, 35));
    const [w, e] = buildMarkers([ev('e1', 'W'), ev('e2', 'E')], places, 'all');
    expect(w.labelAnchor).toBe('start');
    expect(w.labelX).toBeCloseTo(w.x + w.r + 4);
    expect(w.labelY).toBeCloseTo(w.y + 4);
    expect(e.x).toBeGreaterThan(MAP_SCOPES.all.width - 90);
    expect(e.labelAnchor).toBe('end');
    expect(e.labelX).toBeCloseTo(e.x - e.r - 4);
  });

  it('MK-10 (AC-16, AC-P37) Shandong, no filter: label boxes do not intersect pairwise', () => {
    const fs = LABEL_FONT_SIZE.sd;
    const box = (m: MapMarker) => {
      const w = m.name.length * fs;
      const x0 = m.labelAnchor === 'start' ? m.labelX : m.labelX - w;
      return { id: m.name, x0, x1: x0 + w, y0: m.labelY - fs * 0.9, y1: m.labelY + fs * 0.2 };
    };
    const boxes = buildMarkers(book, placeById, 'sd').map(box);
    const hits: string[] = [];
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) hits.push(`${a.id}/${b.id}`);
      }
    expect(hits).toEqual([]);
    expect(boxes.map((b) => b.id)).toEqual(expect.arrayContaining(['梁山泊', '祝家莊', '鄆城縣']));
  });
});

describe('buildTrail / projectTrail', () => {
  it('TR-1 (AC-14) Wu Song: 8 distinct places in book order', () => {
    expect(buildTrail(wusong, idOf('武松'))).toEqual([
      '滄州', '景陽岡', '陽穀縣', '孟州', '青州', '梁山泊', '睦州', '杭州',
    ]);
  });

  it('TR-2 (AC-S10, G-3) consecutive events at the same place merge into one point', () => {
    // 林沖：東京、東京 → 東京；滄州、滄州 → 滄州；之後回到東京不合併（非連續）
    expect(buildTrail(pick('林沖'), idOf('林沖'))).toEqual([
      '東京', '野豬林', '滄州', '東京', '梁山泊', '祝家莊', '梁山泊', '杭州',
    ]);
  });

  it('TR-3 (AC-S10, G-3) unlocated events are skipped (and do not break a merge)', () => {
    const list = [ev('a', '江州', ['s']), ev('b', null, ['s']), ev('c', '江州', ['s']), ev('d', '祝家莊', ['s'])];
    expect(buildTrail(list, 's')).toEqual(['江州', '祝家莊']);
  });

  it('TR-4 only events of that character count', () => {
    const list = [ev('a', '江州', ['s']), ev('b', '東京', ['t']), ev('c', '祝家莊', ['s', 't'])];
    expect(buildTrail(list, 's')).toEqual(['江州', '祝家莊']);
  });

  it('TR-5 (FR-016) geometry: polyline points and step numbers at segment midpoints', () => {
    const ids = buildTrail(wusong, idOf('武松'));
    const g = projectTrail(ids, placeById, 'all');
    expect(g?.points).toHaveLength(8);
    expect(g?.steps.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const a = project('all', placeById.get('滄州')!.lon, placeById.get('滄州')!.lat);
    const b = project('all', placeById.get('景陽岡')!.lon, placeById.get('景陽岡')!.lat);
    expect(g?.steps[0].x).toBeCloseTo((a.x + b.x) / 2);
    expect(g?.steps[0].y).toBeCloseTo((a.y + b.y) / 2);
  });

  it('TR-6 fewer than 2 points draws no trail', () => {
    expect(projectTrail(['江州'], placeById, 'all')).toBeNull();
    expect(projectTrail([], placeById, 'all')).toBeNull();
  });
});

describe('unlocatedCount / eventsAtPlace', () => {
  it('UL-1 Wu Song has no unlocated events', () => {
    expect(unlocatedCount(wusong)).toBe(0);
  });

  it('UL-2 (AC-P27) Wu Song + Song Jiang: 1 unlocated event', () => {
    expect(unlocatedCount(pick('武松', '宋江'))).toBe(1);
  });

  it('EP-1 (AC-P28) Wu Song + Song Jiang at 江州: 3 events', () => {
    expect(eventsAtPlace(pick('武松', '宋江'), '江州').map((e) => e.title)).toEqual([
      '江州結識戴宗・李逵',
      '潯陽樓吟反詩',
      '江州劫法場',
    ]);
  });

  it('EP-2 place outside the filter result has no events', () => {
    expect(eventsAtPlace(wusong, '江州')).toEqual([]);
  });
});

describe('chapterPercent', () => {
  it('RU-1 maps chapter 1 to 0%, 120 to 100%, labels 1/30/60/90/120', () => {
    expect(chapterPercent(1)).toBe(0);
    expect(chapterPercent(120)).toBe(100);
    expect(chapterPercent(60)).toBeCloseTo((59 / 119) * 100);
    expect(RULER_LABELS).toEqual([1, 30, 60, 90, 120]);
  });
});
