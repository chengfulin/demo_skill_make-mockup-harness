/**
 * 精簡章回刻度（S5 地圖欄 ③；Prototype `#mapruler > .mini`；FR-018、AC-P39）。
 * 與地圖同寬（由版面保證）：底條 → 目前範圍色塊 → 各事件起始回直線（`.tk`）→ 數字 1、30、60、90、120；
 * 下方說明「章回刻度 · [<大節名>，]第 <a>–<b> 回，共 <N> 個事件，直線標出各事件的起始回」。
 */
import { RULER_LABELS, chapterPercent } from '../../domain/mapLayout';
import { formatChapterRangeShort } from '../../domain/format';
import type { ChapterRange, StoryEvent } from '../../domain/types';

export interface MapRulerProps {
  /** 目前篩選範圍（未選大節為 1–120） */
  range: ChapterRange;
  /** 已選大節名；未選為 null */
  arcName: string | null;
  /** 篩選結果 */
  events: readonly StoryEvent[];
}

const pct = (n: number) => `${chapterPercent(n).toFixed(2)}%`;

export function MapRuler({ range, arcName, events }: MapRulerProps) {
  const [c0, c1] = range;
  return (
    <div className="mapruler">
      <div className="mini" aria-label="章回範圍">
        <div className="base" />
        <div className="rng" style={{ left: pct(c0), width: `${(chapterPercent(c1) - chapterPercent(c0)).toFixed(2)}%` }} />
        {events.map((e) => (
          <div
            key={e.id}
            className="tk"
            style={{ left: pct(e.chapters[0]) }}
            title={`${e.title}（${formatChapterRangeShort(e.chapters)}）`}
          />
        ))}
        {RULER_LABELS.map((n) => (
          <span
            key={n}
            className={n === 1 ? 'lb first' : n === 120 ? 'lb last' : 'lb'}
            style={{ left: pct(n) }}
          >
            {n}
          </span>
        ))}
      </div>
      <p className="hint">
        章回刻度 · {arcName !== null ? `${arcName}，` : ''}第 {c0}–{c1} 回，共 {events.length} 個事件，直線標出各事件的起始回
      </p>
    </div>
  );
}
