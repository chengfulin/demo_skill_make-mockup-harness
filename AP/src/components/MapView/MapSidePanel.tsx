/**
 * 地圖側欄（S5；Prototype `#mapside`）：① 地點面板 ② 行跡／目前篩選說明。
 * 地點面板：焦點地點在篩選結果中有事件 → 地名、「<N> 個事件」、事件清單（點擊 `onOpenEvent`，AC-P28）；
 * 否則提示文案，焦點地點不在結果中時加「「<地名>」不在目前的篩選結果中。」。
 * 說明面板依已選角色數（0／1／多）三種文案（ui-contracts S5）。
 */
import { formatChapterRangeShort } from '../../domain/format';
import type { StoryEvent } from '../../domain/types';

export interface MapSidePanelProps {
  /** 焦點地點名；無焦點為 null */
  focusPlaceName: string | null;
  /** 焦點地點在篩選結果中的事件（全書順序） */
  focusEvents: readonly StoryEvent[];
  /** 只選一位角色時的姓名；否則 null */
  trailOwnerName: string | null;
  /** 已選角色數 */
  selectedCount: number;
  onOpenEvent: (eventId: string) => void;
}

export function MapSidePanel({
  focusPlaceName,
  focusEvents,
  trailOwnerName,
  selectedCount,
  onOpenEvent,
}: MapSidePanelProps) {
  const showList = focusPlaceName !== null && focusEvents.length > 0;
  return (
    <aside className="side" data-testid="map-side">
      {showList ? (
        <div className="panel">
          <h3>{focusPlaceName}</h3>
          <p className="hint count">{focusEvents.length} 個事件</p>
          <ul className="elist">
            {focusEvents.map((e) => (
              <li key={e.id}>
                <button type="button" data-ev={e.id} onClick={() => onOpenEvent(e.id)}>
                  <span>{formatChapterRangeShort(e.chapters)}</span>
                  <b>{e.title}</b>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="panel">
          <h3>地點</h3>
          <p className="hint">
            點地圖上的標記，列出在該地發生的事件。
            {focusPlaceName !== null && (
              <>
                <br />「{focusPlaceName}」不在目前的篩選結果中。
              </>
            )}
          </p>
        </div>
      )}
      <div className="panel">
        <h3>{trailOwnerName !== null ? `${trailOwnerName}的行跡` : '目前篩選'}</h3>
        <p className="hint">
          {trailOwnerName !== null
            ? '紅色虛線依章回順序連接地點，數字為移動順序。'
            : selectedCount > 1
              ? '選了多位角色時只標出地點，不畫行跡線。只選一位角色可看行跡。'
              : '只選一位角色時，會以虛線畫出他的行跡。'}
        </p>
      </div>
    </aside>
  );
}
