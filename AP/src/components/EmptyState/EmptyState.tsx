/**
 * 空狀態（Prototype `emptyHTML()`；ui-contracts「S2 時間軸」空狀態列）。
 * 篩選結果為 0 時顯示；「清除篩選」清除角色與大節（AC-P14），行為由容器以 `onClear` 提供。
 * `overlay`：地圖／關係圖使用，覆蓋於圖上置中（Prototype S5 的覆蓋層）。
 */
import './EmptyState.css';

export interface EmptyStateProps {
  /** 按「清除篩選」 */
  onClear: () => void;
  /** 覆蓋在地圖／關係圖上（父層需為定位容器） */
  overlay?: boolean;
}

export function EmptyState({ onClear, overlay = false }: EmptyStateProps) {
  const body = (
    <div className="empty">
      <h3>沒有符合條件的事件</h3>
      <p>目前的角色與大節組合下沒有事件。</p>
      <button type="button" className="primary" onClick={onClear}>
        清除篩選
      </button>
    </div>
  );
  return overlay ? <div className="empty-overlay">{body}</div> : body;
}
