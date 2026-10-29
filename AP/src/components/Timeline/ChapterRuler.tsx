/**
 * 章回刻度（S2 ②；Prototype `.ruler > .tick[.minor]`）：起始回與每 10 回標數字，其餘為短刻度
 * （每回寬 ≥60px 時每回、否則每 5 回；由 `timelineLayout` 決定）。
 */
import type { TimelineTick } from '../../domain/timelineLayout';

export interface ChapterRulerProps {
  ticks: readonly TimelineTick[];
  /** 時間軸總寬（px） */
  width: number;
}

export function ChapterRuler({ ticks, width }: ChapterRulerProps) {
  return (
    <div className="ruler" style={{ width }} aria-hidden="true">
      {ticks.map(({ chapter, left, major }) =>
        major ? (
          <span key={chapter} className="tick" style={{ left }}>
            {chapter}
          </span>
        ) : (
          <span key={chapter} className="tick minor" style={{ left }} />
        ),
      )}
    </div>
  );
}
