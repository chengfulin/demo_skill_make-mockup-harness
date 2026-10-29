/**
 * 示意地圖 SVG（S5 地圖框內；Prototype `renderMap` 的 `<svg>`；FR-015～FR-017）。
 * 圖層順序：陸地底 → 海、遼東 → 黃河（全圖另有長江）→ 地名註記 → 梁山泊水域 → 山東框（僅全圖、可點）
 * → 行跡（紅色虛線＋各段中點順序號 1…n）→ 標記。
 * viewBox 依範圍（全圖 860×700、山東 860×620），寬 100% 自動縮放（CSS）。
 */
import type { KeyboardEvent } from 'react';
import { SHANDONG_BOX, SHANDONG_BOX_LABEL, basemap } from '../../domain/mapGeometry';
import {
  LABEL_FONT_SIZE,
  type MapMarker as Marker,
  type MapScopeId,
  type TrailGeometry,
} from '../../domain/mapLayout';
import { MapMarker } from './MapMarker';

export interface MapSvgProps {
  scope: MapScopeId;
  markers: readonly Marker[];
  /** 只選一位角色且 ≥2 點時才有 */
  trail: TrailGeometry | null;
  focusPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  /** 點全圖上的山東框（AC-P36） */
  onZoomShandong: () => void;
}

const SVG_NAME: Readonly<Record<MapScopeId, string>> = {
  all: '北宋疆域示意地圖',
  sd: '山東範圍示意地圖',
};

export function MapSvg({ scope, markers, trail, focusPlaceId, onSelectPlace, onZoomShandong }: MapSvgProps) {
  const base = basemap(scope);
  const onBoxKey = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onZoomShandong();
    }
  };
  return (
    <svg viewBox={`0 0 ${base.width} ${base.height}`} role="img" aria-label={SVG_NAME[scope]}>
      <rect className="land" width={base.width} height={base.height} />
      <polygon className="sea" points={base.sea} />
      <polygon className="land" points={base.liaodong} />
      {base.rivers.map((points, i) => (
        <polyline key={i} className="river" points={points} />
      ))}
      {base.labels.map(({ x, y, text, sea }) => (
        <text key={text} className={sea ? 'rlabel sea-label' : 'rlabel'} x={x} y={y}>
          {text}
        </text>
      ))}
      <ellipse className="marsh" cx={base.marsh.cx} cy={base.marsh.cy} rx={base.marsh.rx} ry={base.marsh.ry} />
      {scope === 'all' && (
        <g
          className="sdbox"
          data-scope="sd"
          role="button"
          tabIndex={0}
          aria-label="放大山東"
          onClick={onZoomShandong}
          onKeyDown={onBoxKey}
        >
          <rect x={SHANDONG_BOX.x} y={SHANDONG_BOX.y} width={SHANDONG_BOX.width} height={SHANDONG_BOX.height} rx={4} />
          <text x={SHANDONG_BOX.labelX} y={SHANDONG_BOX.labelY}>
            {SHANDONG_BOX_LABEL}
          </text>
        </g>
      )}
      {trail && (
        <g className="trail-layer">
          <polyline className="trail" points={trail.points.map((p) => `${p.x},${p.y}`).join(' ')} />
          {trail.steps.map(({ x, y, n }) => (
            <g key={n}>
              <circle className="trailstep" cx={x} cy={y} r={8} />
              <text className="trailno" x={x} y={y} textAnchor="middle" dominantBaseline="central">
                {n}
              </text>
            </g>
          ))}
        </g>
      )}
      {markers.map((m) => (
        <MapMarker
          key={m.placeId}
          marker={m}
          focused={m.placeId === focusPlaceId}
          labelSize={LABEL_FONT_SIZE[scope]}
          onSelect={onSelectPlace}
        />
      ))}
    </svg>
  );
}
