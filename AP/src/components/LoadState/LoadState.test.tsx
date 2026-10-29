/**
 * 載入狀態 LoadState（T030；ui-contracts「載入狀態」；spec G-4、FR-022、AC-S4／AC-S5 的元件層）
 *
 * 介面：{ status: 'loading' } | { status: 'error'; onRetry: () => void }
 *   loading：`div.empty[role=status][data-testid=loading]` > p「資料載入中…」，無按鈕；
 *   error：`div.empty[role=alert][data-testid=load-error]` > p「資料載入失敗，請稍後再試。」→ button.primary「重試」。
 *   樣式沿用 EmptyState 的 `.empty`／`.primary`。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：status='loading'
 *
 * | 特徵            | blocks                         | base     | 對應案例     |
 * | :-------------- | :----------------------------- | :------- | :----------- |
 * | S1 載入狀態     | loading／error                 | loading  | LS-S1        |
 * | A1 使用者操作   | 不點擊／點「重試」（error 時） | 不點擊   | LS-A1        |
 *
 * 範圍外（一次性宣告）：重試後重新載入的流程（DatasetProvider 與 App.test 驗）；
 * 「頁首照常顯示、S1～S6 不渲染」（App 層，T037 驗）；色值與版面（CSS）。
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoadState } from './LoadState';

describe('LoadState', () => {
  it('BASE loading shows status message without retry button', () => {
    render(<LoadState status="loading" />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('data-testid', 'loading');
    expect(el).toHaveClass('empty');
    expect(el).toHaveTextContent('資料載入中…');
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('LS-S1 error shows alert message and retry button', () => {
    const onRetry = vi.fn();
    render(<LoadState status="error" onRetry={onRetry} />);
    const el = screen.getByRole('alert');
    expect(el).toHaveAttribute('data-testid', 'load-error');
    expect(el).toHaveClass('empty');
    expect(el).toHaveTextContent('資料載入失敗，請稍後再試。');
    const button = screen.getByRole('button', { name: '重試' });
    expect(button).toHaveClass('primary');
    expect(el).toContainElement(button);
    expect(screen.queryByRole('status')).toBeNull();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('LS-A1 clicking retry calls onRetry once', async () => {
    const onRetry = vi.fn();
    render(<LoadState status="error" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: '重試' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
