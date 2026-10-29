/**
 * S3 底部上一個／下一個（Prototype `.pn` 內兩個按鈕；FR-012、G-2）。
 * 由容器放進 Drawer 的 `footer`（Drawer 輸出 `.pn` 外框，樣式與停用透明度 .4 見 Drawer.css）。
 * 首個時「← 已是第一個」停用（AC-S26）；末個時「已是最後一個 →」停用（AC-S15）。
 * prev／next 由 `domain/navigation.prevNext` 算出。
 */
import type { StoryEvent } from '../../domain/types';

export interface PrevNextNavProps {
  /** 前一事件；已是第一個為 null */
  prev: StoryEvent | null;
  /** 後一事件；已是最後一個為 null */
  next: StoryEvent | null;
  /** 切換到指定事件 */
  onNavigate: (eventId: string) => void;
}

export function PrevNextNav({ prev, next, onNavigate }: PrevNextNavProps) {
  return (
    <>
      <button type="button" disabled={prev === null} onClick={() => prev && onNavigate(prev.id)}>
        ← {prev ? prev.title : '已是第一個'}
      </button>
      <button type="button" disabled={next === null} onClick={() => next && onNavigate(next.id)}>
        {next ? next.title : '已是最後一個'} →
      </button>
    </>
  );
}
