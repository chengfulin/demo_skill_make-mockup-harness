/**
 * 大節色帶（S2 ①；Prototype `.arcs > button.arc`）：每段為按鈕「<大節名> ／ <a>–<b>」，
 * 點擊＝選該大節（AC-P17，US3 接上 `onSelectArc`）；奇數條（`alt`）底色 `--paper-2`。
 */
import { formatArcBand } from '../../domain/format';
import type { TimelineBand } from '../../domain/timelineLayout';

export interface ArcBandsProps {
  bands: readonly TimelineBand[];
  /** 時間軸總寬（px） */
  width: number;
  onSelectArc?: (arcId: string) => void;
}

export function ArcBands({ bands, width, onSelectArc }: ArcBandsProps) {
  return (
    <div className="arcs" style={{ width }}>
      {bands.map(({ arc, left, width: w, alt }) => (
        <button
          key={arc.id}
          type="button"
          className={alt ? 'arc alt' : 'arc'}
          style={{ left, width: w }}
          title={arc.name}
          onClick={onSelectArc ? () => onSelectArc(arc.id) : undefined}
        >
          <b>{arc.name}</b>
          <span>{formatArcBand(arc)}</span>
        </button>
      ))}
    </div>
  );
}
