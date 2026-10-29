/**
 * S2 時間軸（展示元件；contracts/ui-contracts.md「S2」；plan「時間軸（S2，FR-006／FR-007）」）。
 * 寬螢幕：`tl-scroll`（data-testid="timeline"，容器內橫向捲動）> .tl > 色帶 → 刻度 → 車道（或 `empty`）。
 * ≤720px（useIsNarrow）：只渲染 `TimelineList`（AC-P42）。
 * 版面由 `computeLayout(可用寬)` 算出：以 useElementWidth 量 tl-scroll 內容寬，未量到時為 0（每回取 UNIT_MIN），
 * 量到或尺寸改變時重算。tl-scroll 不設 padding，clientWidth 與 contentRect.width 口徑一致。
 * `scrollResetKey`（容器傳目前大節）改變時把 tl-scroll 的 scrollLeft 歸零，避免切大節後
 * 色帶標題與左側卡片被捲出視窗（Prototype 行為）。
 */
import { useCallback, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import type { TimelineLayout } from '../../domain/timelineLayout';
import type { Arc, Character, StoryEvent } from '../../domain/types';
import { useElementWidth } from '../hooks/useElementWidth';
import { useIsNarrow } from '../hooks/useMediaQuery';
import { ArcBands } from './ArcBands';
import { ChapterRuler } from './ChapterRuler';
import { TimelineLanes } from './TimelineLanes';
import { TimelineList } from './TimelineList';
import './Timeline.css';

export interface TimelineProps {
  /** 容器傳入：w => timelineLayout(events, arcs, range, w) */
  computeLayout: (availableWidth: number) => TimelineLayout;
  /** 已篩選、全書順序（直向列表分組用） */
  events: readonly StoryEvent[];
  arcs: readonly Arc[];
  characterById: ReadonlyMap<string, Character>;
  /** 已選角色（頭像排前、加外框） */
  selectedIds?: ReadonlySet<string>;
  onOpenEvent: (eventId: string) => void;
  /** 色帶／直向列表組標題按鈕（US3 接上） */
  onSelectArc?: (arcId: string) => void;
  /** 篩選結果為 0 時取代車道（US2） */
  empty?: ReactNode;
  /** 值改變時橫向捲動歸零（容器傳目前大節 id；null 為全部大節） */
  scrollResetKey?: string | null;
}

export function Timeline({
  computeLayout,
  events,
  arcs,
  characterById,
  selectedIds,
  onOpenEvent,
  onSelectArc,
  empty,
  scrollResetKey = null,
}: TimelineProps) {
  const narrow = useIsNarrow();
  const [measureRef, availableWidth] = useElementWidth<HTMLDivElement>();
  const scrollEl = useRef<HTMLDivElement | null>(null);
  const scrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollEl.current = node;
      return measureRef(node);
    },
    [measureRef],
  );
  useLayoutEffect(() => {
    if (scrollEl.current) scrollEl.current.scrollLeft = 0;
  }, [scrollResetKey]);
  const layout = useMemo(
    () => (narrow ? null : computeLayout(availableWidth)),
    [narrow, computeLayout, availableWidth],
  );

  return (
    <section className="view timeline-view" data-page="S2 時間軸">
      {layout ? (
        <div className="tl-scroll" data-testid="timeline" ref={scrollRef}>
          <div className="tl" style={{ width: layout.width }}>
            <ArcBands bands={layout.bands} width={layout.width} onSelectArc={onSelectArc} />
            <ChapterRuler ticks={layout.ticks} width={layout.width} />
            {layout.cards.length === 0 ? (
              empty
            ) : (
              <TimelineLanes
                cards={layout.cards}
                width={layout.width}
                height={layout.height}
                characterById={characterById}
                selectedIds={selectedIds}
                onOpenEvent={onOpenEvent}
              />
            )}
          </div>
        </div>
      ) : (
        <TimelineList
          events={events}
          arcs={arcs}
          characterById={characterById}
          selectedIds={selectedIds}
          onOpenEvent={onOpenEvent}
          onSelectArc={onSelectArc}
          empty={empty}
        />
      )}
    </section>
  );
}
