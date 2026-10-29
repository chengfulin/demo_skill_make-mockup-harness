/**
 * S1 搜尋框（Prototype `label.search` > 放大鏡 svg ＋ `input#q`；contracts/ui-contracts.md「S1」）。
 * 即打即篩：每次輸入呼叫 `onChange`；Enter 呼叫 `onSubmit`（選取第一個符合者由容器判斷，D-3）。
 * 中文輸入法組字中的 Enter 是確認選字，不觸發 `onSubmit`。
 */
import type { KeyboardEvent } from 'react';

export interface SearchBoxProps {
  value: string;
  onChange: (q: string) => void;
  onSubmit: () => void;
}

export function SearchBox({ value, onChange, onSubmit }: SearchBoxProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <label className="search">
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
      <input
        type="search"
        placeholder="搜尋姓名或綽號，例如：黑旋風"
        autoComplete="off"
        aria-label="搜尋角色"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </label>
  );
}
