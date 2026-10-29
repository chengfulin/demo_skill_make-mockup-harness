/**
 * 地圖版面（Prototype `SCOPES`、`px`、`inScope`、`renderMap`；FR-015～FR-018）。
 * - 範圍部分（Foundational）：`MAP_SCOPES`、`project`、`inScope`（AC-P36）。
 * - US6 擴充：`buildMarkers`（標記、事件數、40 輪推開、標籤側別；AC-16、AC-P37）、
 *   `buildTrail`／`projectTrail`（行跡，FR-016、G-3、AC-S10）、`unlocatedCount`（AC-P27）、
 *   `eventsAtPlace`（側欄地點面板，AC-P28）、`chapterPercent`、`RULER_LABELS`（精簡章回刻度，FR-018）。
 * 純函式，不 import React；元件只畫。
 */
import type { ChapterRange, Place, StoryEvent } from './types';

export type MapScopeId = 'all' | 'sd';

export interface MapScope {
  /** viewBox 寬 */
  width: number;
  /** viewBox 高 */
  height: number;
  /** 經度範圍 [lon0, lon1] */
  lon: readonly [number, number];
  /** 緯度範圍 [lat0, lat1] */
  lat: readonly [number, number];
  /** 範圍名稱（Prototype `SCOPES.*.label`） */
  label: string;
}

/** 兩個地圖範圍：全圖、山東（數值同 Prototype `SCOPES`）。 */
export const MAP_SCOPES: Readonly<Record<MapScopeId, MapScope>> = {
  all: { width: 860, height: 700, lon: [105, 122.5], lat: [27, 41.5], label: '全圖' },
  sd: { width: 860, height: 620, lon: [114.6, 119.2], lat: [34.6, 37.9], label: '山東' },
};

/** 等距投影：x=(lon−lon0)/(lon1−lon0)·W，y=(lat1−lat)/(lat1−lat0)·H。 */
export function project(scope: MapScopeId, lon: number, lat: number): { x: number; y: number } {
  const s = MAP_SCOPES[scope];
  return {
    x: ((lon - s.lon[0]) / (s.lon[1] - s.lon[0])) * s.width,
    y: ((s.lat[1] - lat) / (s.lat[1] - s.lat[0])) * s.height,
  };
}

/** 地點是否在範圍內（含邊界）。 */
export function inScope(scope: MapScopeId, place: Pick<Place, 'lon' | 'lat'>): boolean {
  const s = MAP_SCOPES[scope];
  return place.lon >= s.lon[0] && place.lon <= s.lon[1] && place.lat >= s.lat[0] && place.lat <= s.lat[1];
}

// ───────────────────────── US6：標記 ─────────────────────────

/** 標記基本半徑（Prototype：山東 12、全圖 9）。 */
export const MARKER_BASE_RADIUS: Readonly<Record<MapScopeId, number>> = { all: 9, sd: 12 };
/** 每個事件增加的半徑；事件數最多計 8 個。 */
export const MARKER_RADIUS_PER_EVENT = 1.3;
export const MARKER_RADIUS_MAX_EVENTS = 8;
/** 推開時兩標記外緣的最小間距（山東 6、全圖 2）。 */
export const MARKER_GAP: Readonly<Record<MapScopeId, number>> = { all: 2, sd: 6 };
/** 推開輪數。 */
export const RELAX_ITERATIONS = 40;
/** 標記中心離右緣不足此值時，標籤改放左側。 */
export const LABEL_FLIP_MARGIN = 90;
/** 標籤與圓外緣的水平間距。 */
export const LABEL_OFFSET = 4;
/** 標籤基線相對圓心的下移量。 */
export const LABEL_BASELINE_DY = 4;
/** 標籤字級（山東放大為 15px，全圖 12px）。 */
export const LABEL_FONT_SIZE: Readonly<Record<MapScopeId, number>> = { all: 12, sd: 15 };

/** 地圖上的一個地點標記（顯示位置已推開）。 */
export interface MapMarker {
  /** 地點 id（＝地名） */
  placeId: string;
  /** 地名 */
  name: string;
  /** 該地在篩選結果中的事件（全書順序） */
  events: readonly StoryEvent[];
  /** 顯示位置（推開後） */
  x: number;
  y: number;
  /** 半徑 */
  r: number;
  /** 標籤錨點（`text-anchor` 對應的 x）與基線 y */
  labelX: number;
  labelY: number;
  /** 標籤靠右（start）或靠左（end） */
  labelAnchor: 'start' | 'end';
}

/** 標記半徑：`(山東 12｜全圖 9) + min(事件數, 8)·1.3`。 */
export function markerRadius(scope: MapScopeId, eventCount: number): number {
  return MARKER_BASE_RADIUS[scope] + Math.min(eventCount, MARKER_RADIUS_MAX_EVENTS) * MARKER_RADIUS_PER_EVENT;
}

/** 依地點分組篩選結果中可定位的事件；Map 依地點首次出現順序。 */
export function groupByPlace(filtered: readonly StoryEvent[]): Map<string, StoryEvent[]> {
  const byPlace = new Map<string, StoryEvent[]>();
  for (const e of filtered) {
    if (e.place === null) continue;
    const list = byPlace.get(e.place);
    if (list) list.push(e);
    else byPlace.set(e.place, [e]);
  }
  return byPlace;
}

/**
 * 相鄰標記兩兩推開（Prototype：40 輪，重疊量平均分給兩端，只影響顯示位置）。
 * 就地修改 `items` 的 x、y。
 */
export function relaxMarkers(
  items: Array<{ x: number; y: number; r: number }>,
  gap: number,
  iterations: number = RELAX_ITERATIONS,
): void {
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const need = a.r + b.r + gap;
        if (d < need) {
          const k = (need - d) / 2 / d;
          a.x -= dx * k;
          a.y -= dy * k;
          b.x += dx * k;
          b.y += dy * k;
        }
      }
    }
  }
}

/**
 * 建立地點標記：只含篩選結果中、可定位且在範圍內的地點（FR-015、FR-017）。
 * 順序為地點在篩選結果中首次出現的順序；位置經推開；標籤靠右，近右緣（x > W−90）改靠左。
 */
export function buildMarkers(
  filtered: readonly StoryEvent[],
  places: ReadonlyMap<string, Place>,
  scope: MapScopeId,
): MapMarker[] {
  const items: Array<{ place: Place; events: StoryEvent[]; x: number; y: number; r: number }> = [];
  for (const [placeId, events] of groupByPlace(filtered)) {
    const place = places.get(placeId);
    if (!place || !inScope(scope, place)) continue;
    const { x, y } = project(scope, place.lon, place.lat);
    items.push({ place, events, x, y, r: markerRadius(scope, events.length) });
  }
  relaxMarkers(items, MARKER_GAP[scope]);
  const width = MAP_SCOPES[scope].width;
  return items.map(({ place, events, x, y, r }) => {
    const flip = x > width - LABEL_FLIP_MARGIN;
    return {
      placeId: place.id,
      name: place.name,
      events,
      x,
      y,
      r,
      labelX: flip ? x - r - LABEL_OFFSET : x + r + LABEL_OFFSET,
      labelY: y + LABEL_BASELINE_DY,
      labelAnchor: flip ? 'end' : 'start',
    };
  });
}

/** 篩選結果中某地點的事件（側欄地點面板；不受地圖範圍影響）。 */
export function eventsAtPlace(filtered: readonly StoryEvent[], placeId: string): StoryEvent[] {
  return filtered.filter((e) => e.place === placeId);
}

/** 篩選結果中無法定位地點（`place` 為 null）的事件數（AC-P27）。 */
export function unlocatedCount(filtered: readonly StoryEvent[]): number {
  return filtered.reduce((n, e) => (e.place === null ? n + 1 : n), 0);
}

// ───────────────────────── US6：行跡 ─────────────────────────

/**
 * 單一角色行跡的地點序列（FR-016、G-3、AC-S10）：
 * 取篩選結果（全書順序）中該角色、`place ≠ null` 的事件，連續同地點合併為一點。
 */
export function buildTrail(filtered: readonly StoryEvent[], characterId: string): string[] {
  const seq: string[] = [];
  for (const e of filtered) {
    if (e.place === null || !e.characters.includes(characterId)) continue;
    if (seq[seq.length - 1] !== e.place) seq.push(e.place);
  }
  return seq;
}

/** 行跡幾何：折線頂點與各段中點的順序號（1…n）。 */
export interface TrailGeometry {
  points: ReadonlyArray<{ x: number; y: number }>;
  steps: ReadonlyArray<{ x: number; y: number; n: number }>;
}

/**
 * 行跡投影到範圍座標（Prototype：用地點原始投影座標，不用推開後位置；範圍外的點照樣投影）。
 * 少於 2 點時回傳 null（不畫行跡）。
 */
export function projectTrail(
  placeIds: readonly string[],
  places: ReadonlyMap<string, Place>,
  scope: MapScopeId,
): TrailGeometry | null {
  const points = placeIds.flatMap((id) => {
    const p = places.get(id);
    return p ? [project(scope, p.lon, p.lat)] : [];
  });
  if (points.length < 2) return null;
  const steps = points.slice(0, -1).map((p, i) => {
    const q = points[i + 1];
    return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, n: i + 1 };
  });
  return { points, steps };
}

// ───────────────────────── US6：精簡章回刻度 ─────────────────────────

/** 全書回數區間。 */
export const BOOK_RANGE: ChapterRange = [1, 120];
/** 刻度數字（FR-018）。 */
export const RULER_LABELS: readonly number[] = [1, 30, 60, 90, 120];

/** 第 n 回在 1–120 刻度上的位置（0～100，百分比）：`(n−1)/119·100`。 */
export function chapterPercent(n: number): number {
  return ((n - 1) / (BOOK_RANGE[1] - BOOK_RANGE[0])) * 100;
}
