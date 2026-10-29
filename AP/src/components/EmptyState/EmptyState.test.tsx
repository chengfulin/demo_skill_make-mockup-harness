/**
 * 空狀態 EmptyState（T034；ui-contracts「S2 時間軸」空狀態列；Prototype `emptyHTML()`、S5 覆蓋層）
 *
 * 介面：{ onClear: () => void; overlay?: boolean }
 *   渲染 `div.empty` > h3「沒有符合條件的事件」→ p「目前的角色與大節組合下沒有事件。」→ button.primary「清除篩選」；
 *   overlay 為 true 時外包 `div.empty-overlay`（地圖／關係圖覆蓋）。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：overlay 未給、不點擊
 *
 * | 特徵            | blocks                         | base     | 對應案例     |
 * | :-------------- | :----------------------------- | :------- | :----------- |
 * | O1 覆蓋模式     | 未給／true／false              | 未給     | ES-O1、ES-O2 |
 * | A1 使用者操作   | 不點擊／點「清除篩選」         | 不點擊   | ES-A1        |
 *
 * 範圍外（一次性宣告）：實際色值、置中與覆蓋版面（由 CSS 決定，Prototype 並列比對 E2E 驗）；
 * 清除篩選後的狀態變化（reducer `clearFilters` 與容器負責）。
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('BASE renders verbatim title, note, clear button in order, no overlay', () => {
    const onClear = vi.fn();
    const { container } = render(<EmptyState onClear={onClear} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('empty');
    const children = Array.from(root.children);
    expect(children.map((el) => el.tagName)).toEqual(['H3', 'P', 'BUTTON']);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('沒有符合條件的事件');
    expect(children[1]).toHaveTextContent('目前的角色與大節組合下沒有事件。');
    const button = screen.getByRole('button', { name: '清除篩選' });
    expect(button).toHaveClass('primary');
    expect(button).toHaveAttribute('type', 'button');
    expect(container.querySelector('.empty-overlay')).toBeNull();
    expect(onClear).not.toHaveBeenCalled();
  });

  it('ES-O1 overlay wraps empty in .empty-overlay', () => {
    const { container } = render(<EmptyState onClear={() => {}} overlay />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('empty-overlay');
    expect(root.querySelector(':scope > .empty')).not.toBeNull();
    expect(screen.getByRole('button', { name: '清除篩選' })).toBeInTheDocument();
  });

  it('ES-O2 overlay=false renders plain .empty', () => {
    const { container } = render(<EmptyState onClear={() => {}} overlay={false} />);
    expect(container.firstElementChild).toHaveClass('empty');
    expect(container.querySelector('.empty-overlay')).toBeNull();
  });

  it('ES-A1 clicking clear calls onClear once', async () => {
    const onClear = vi.fn();
    render(<EmptyState onClear={onClear} />);
    await userEvent.click(screen.getByRole('button', { name: '清除篩選' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
