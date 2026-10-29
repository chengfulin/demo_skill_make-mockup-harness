/**
 * 地點標記（S5；Prototype `g.mk[data-place][role=button][tabindex=0]`）。
 * 圓（`circle.o`，焦點地點加 `.hi` 填朱色）＋ 圓內事件數（`text.n`）＋ 地名標籤（`text.l`，山東範圍 15px）。
 * `aria-label`「<地名>，<N> 個事件」；點擊或 Enter／Space 回呼 `onSelect(placeId)`（AC-P28）。
 */
import type { KeyboardEvent } from 'react';
import type { MapMarker as Marker } from '../../domain/mapLayout';

export interface MapMarkerProps {
  marker: Marker;
  focused: boolean;
  /** 標籤字級（px；山東 15、全圖 12） */
  labelSize: number;
  onSelect: (placeId: string) => void;
}

export function MapMarker({ marker, focused, labelSize, onSelect }: MapMarkerProps) {
  const { placeId, name, events, x, y, r, labelX, labelY, labelAnchor } = marker;
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(placeId);
    }
  };
  return (
    <g
      className={focused ? 'mk hi' : 'mk'}
      data-place={placeId}
      role="button"
      tabIndex={0}
      aria-label={`${name}，${events.length} 個事件`}
      onClick={() => onSelect(placeId)}
      onKeyDown={onKeyDown}
    >
      <circle className="o" cx={x} cy={y} r={r} />
      <text className="n" x={x} y={y}>
        {events.length}
      </text>
      <text className="l" x={labelX} y={labelY} textAnchor={labelAnchor} style={{ fontSize: labelSize }}>
        {name}
      </text>
    </g>
  );
}
