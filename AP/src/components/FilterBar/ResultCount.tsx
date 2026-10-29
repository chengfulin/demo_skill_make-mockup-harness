/**
 * 結果數（S1 結果列）：「共 <N> 個事件」，N 由容器以 selector 計算後傳入。
 * 依據：contracts/ui-contracts.md S1「結果數」；Prototype `.count[aria-live=polite]`。
 */
export interface ResultCountProps {
  count: number;
}

export function ResultCount({ count }: ResultCountProps) {
  return (
    <div className="count" data-testid="result-count" aria-live="polite">
      共<b>{count}</b>個事件
    </div>
  );
}
