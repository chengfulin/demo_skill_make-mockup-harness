/**
 * 地圖版面（範圍部分；Prototype `SCOPES`、`px`、`inScope`；FR-015～FR-018、AC-P36）。
 * US6 會再擴充本檔（標記推開、行跡、無法定位計數）。
 */
import type { Place } from './types';

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
