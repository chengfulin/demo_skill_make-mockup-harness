/**
 * 示意底圖常數（T118；Prototype `SEA`、`LIAODONG`、`HUANGHE`、`CHANGJIANG`、`lab(...)`、`.marsh`、`sdBox`；
 * research R4、plan「地圖（S5）」）。
 *
 * 折線與註記以經緯度（[lon, lat]）保存，由 `basemap(scope)` 以 `mapLayout.project` 投影成該範圍的 SVG 座標。
 * 陸地底為整個 viewBox 的矩形（元件直接畫），故無陸地折線；遼東半島以陸地色多邊形疊在海上。
 * 純資料＋純函式，不 import React。
 */
import { MAP_SCOPES, project, type MapScopeId } from './mapLayout';

/** 經緯度點 [lon, lat]。 */
export type LonLat = readonly [number, number];

/** 海（東海、黃海、渤海；多邊形）。 */
export const SEA: readonly LonLat[] = [
  [123.5, 41.5], [121.4, 40.9], [120.4, 40.2], [119.4, 39.8], [118.3, 39.1], [117.7, 38.7], [118.3, 38.0],
  [119.0, 37.2], [120.0, 37.5], [120.7, 37.8], [121.6, 37.5], [122.5, 37.3], [122.4, 36.9], [121.0, 36.6],
  [120.2, 35.9], [119.4, 35.1], [120.3, 34.3], [120.8, 33.2], [121.0, 32.4], [121.9, 31.7], [121.9, 30.9],
  [121.1, 30.4], [122.0, 29.9], [121.6, 28.8], [121.1, 27.9], [120.7, 27.0], [123.5, 27.0],
];

/** 遼東半島（陸地色多邊形，疊在海上）。 */
export const LIAODONG: readonly LonLat[] = [
  [123.5, 41.5], [122.3, 40.8], [121.6, 39.6], [121.2, 38.8], [122.1, 39.2], [123.5, 39.9],
];

/** 黃河（北宋河道示意；折線）。 */
export const HUANGHE: readonly LonLat[] = [
  [105, 36.6], [106.4, 38.5], [107.6, 40.3], [109.8, 40.6], [111.2, 40.0], [110.6, 37.6], [110.3, 35.4],
  [111.6, 34.8], [113.4, 34.9], [114.6, 35.1], [115.5, 36.3], [116.4, 37.5], [117.3, 38.6], [117.7, 38.95],
];

/** 長江（折線；僅全圖）。 */
export const CHANGJIANG: readonly LonLat[] = [
  [105, 29.4], [106.6, 29.6], [108.4, 30.8], [110.4, 31.0], [111.4, 30.6], [112.5, 29.8], [113.4, 29.8],
  [114.3, 30.6], [115.6, 29.8], [116.4, 29.8], [117.5, 30.7], [118.4, 31.4], [118.9, 32.1], [119.9, 32.2],
  [120.9, 31.9], [121.8, 31.5],
];

/** 地名註記；`sea` 為海名（字級 14px、字距 .3em）。 */
export interface BasemapLabel {
  lon: number;
  lat: number;
  text: string;
  sea?: boolean;
}

/** 各範圍的地名註記（ui-contracts S5「底圖註記」）。 */
export const BASEMAP_LABELS: Readonly<Record<MapScopeId, readonly BasemapLabel[]>> = {
  all: [
    { lon: 111.0, lat: 40.55, text: '黃河（北宋河道示意）' },
    { lon: 109.4, lat: 31.4, text: '長江' },
    { lon: 121, lat: 33.8, text: '東海', sea: true },
  ],
  sd: [
    { lon: 115.9, lat: 37.3, text: '黃河（北宋河道示意）' },
    { lon: 118.75, lat: 35.0, text: '黃海', sea: true },
  ],
};

/** 梁山泊水域橢圓：中心經緯度與各範圍半徑。 */
export const MARSH = {
  lon: 116.1,
  lat: 35.8,
  radius: { all: { rx: 22, ry: 13 }, sd: { rx: 60, ry: 34 } } as Readonly<Record<MapScopeId, { rx: number; ry: number }>>,
} as const;

/** 投影後的底圖（SVG 座標）。 */
export interface Basemap {
  width: number;
  height: number;
  /** `points` 屬性字串（座標取 1 位小數） */
  sea: string;
  liaodong: string;
  rivers: readonly string[];
  labels: ReadonlyArray<{ x: number; y: number; text: string; sea: boolean }>;
  marsh: { cx: number; cy: number; rx: number; ry: number };
}

/** 經緯度折線 → SVG `points` 字串（Prototype `pts`：1 位小數）。 */
export function toPoints(scope: MapScopeId, line: readonly LonLat[]): string {
  return line
    .map(([lon, lat]) => {
      const { x, y } = project(scope, lon, lat);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** 某範圍的投影底圖（全圖含長江；山東不含）。 */
export function basemap(scope: MapScopeId): Basemap {
  const { width, height } = MAP_SCOPES[scope];
  const center = project(scope, MARSH.lon, MARSH.lat);
  return {
    width,
    height,
    sea: toPoints(scope, SEA),
    liaodong: toPoints(scope, LIAODONG),
    rivers: scope === 'all' ? [toPoints(scope, HUANGHE), toPoints(scope, CHANGJIANG)] : [toPoints(scope, HUANGHE)],
    labels: BASEMAP_LABELS[scope].map((l) => ({ ...project(scope, l.lon, l.lat), text: l.text, sea: l.sea ?? false })),
    marsh: { cx: center.x, cy: center.y, ...MARSH.radius[scope] },
  };
}

/** 全圖上的山東框（全圖座標；Prototype `sdBox`）：矩形與標籤位置。 */
export const SHANDONG_BOX: Readonly<{ x: number; y: number; width: number; height: number; labelX: number; labelY: number }> =
  (() => {
    const sd = MAP_SCOPES.sd;
    const tl = project('all', sd.lon[0], sd.lat[1]);
    const br = project('all', sd.lon[1], sd.lat[0]);
    return { x: tl.x, y: tl.y, width: br.x - tl.x, height: br.y - tl.y, labelX: tl.x + 6, labelY: tl.y - 6 };
  })();

/** 山東框標籤文案（ui-contracts S5）。 */
export const SHANDONG_BOX_LABEL = '山東 · 點此放大';
