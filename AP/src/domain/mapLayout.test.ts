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
 * 範圍外（一次性宣告）：非數值經緯度（資料由轉換腳本產生）；標記推開、行跡、無法定位計數（US6 擴充）。
 */
import { describe, expect, it } from 'vitest';
import { realDataset } from '../test-utils/realDataset';
import type { Place } from './types';
import { MAP_SCOPES, inScope, project } from './mapLayout';

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
