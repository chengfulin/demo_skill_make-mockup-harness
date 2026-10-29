/**
 * 載入狀態（ui-contracts「載入狀態」，spec G-4、FR-022；Prototype 未定義，文案為開發端補齊）。
 * 樣式沿用 EmptyState 的 `.empty`／`.primary`。
 * 載入中：`role="status"`；失敗：`role="alert"`＋「重試」（`onRetry`）。
 */
import '../EmptyState/EmptyState.css';

export type LoadStateProps =
  | { status: 'loading' }
  | { status: 'error'; onRetry: () => void };

export function LoadState(props: LoadStateProps) {
  if (props.status === 'loading') {
    return (
      <div className="empty" role="status" data-testid="loading">
        <p>資料載入中…</p>
      </div>
    );
  }
  return (
    <div className="empty" role="alert" data-testid="load-error">
      <p>資料載入失敗，請稍後再試。</p>
      <button type="button" className="primary" onClick={props.onRetry}>
        重試
      </button>
    </div>
  );
}
