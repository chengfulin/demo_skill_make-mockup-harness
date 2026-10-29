/**
 * 面板共用殼 Drawer（T035；ui-contracts「S3」「S4」區塊順序；Prototype `#scrim`＋`aside.drawer`；G-10、AC-S24 的元件層）
 *
 * 介面：{ page: string; label: string; testId: string; kicker: string; onClose: () => void;
 *         children: ReactNode; footer?: ReactNode }
 *   渲染 `div.scrim` → `aside.drawer[data-page][aria-label][data-testid]` >
 *   `.dh`（`.k` 類別字 → `button.x`「×」aria-label「關閉」）→ `.db`（children）→（footer 有給時）`.pn`。
 *   關閉鈕、點遮罩、按 Escape 皆呼叫 onClose。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：S3 參數（page「S3 事件明細面板」、label「事件明細」、testId event-drawer）、footer 未給、無操作
 *
 * | 特徵              | blocks                                         | base     | 對應案例          |
 * | :---------------- | :--------------------------------------------- | :------- | :---------------- |
 * | P1 面板參數       | S3 參數／S4 參數（角色資料）                   | S3       | DR-P1             |
 * | F1 底部列         | 未給／有給                                     | 未給     | DR-F1             |
 * | A1 使用者操作     | 無／點關閉鈕／點遮罩／按 Escape／按其他鍵／點面板內部 | 無 | DR-A1～DR-A5     |
 * | U1 卸載後         | 掛載中／已卸載後按 Escape                      | 掛載中   | DR-U1             |
 *
 * 範圍外（一次性宣告）：≤720px 底部抽屜與寬度（純 CSS media query，jsdom 不排版；由 E2E 400px 情境驗 FR-012／FR-014）；
 * 開哪個面板、關閉後的狀態（reducer `closeDrawer` 與容器負責）；焦點移動（Prototype 無此行為）。
 */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Drawer, type DrawerProps } from './Drawer';

const S3: Omit<DrawerProps, 'onClose' | 'children'> = {
  page: 'S3 事件明細面板',
  label: '事件明細',
  testId: 'event-drawer',
  kicker: '事件 · 誤走妖魔・魯智深與林沖',
};

function setup(overrides: Partial<DrawerProps> = {}) {
  const onClose = vi.fn();
  const utils = render(
    <Drawer {...S3} onClose={onClose} {...overrides}>
      {overrides.children ?? <h2>大鬧野豬林</h2>}
    </Drawer>,
  );
  return { onClose, ...utils };
}

describe('Drawer', () => {
  it('BASE renders scrim then aside with dh(kicker, close) and db(children), no pn', () => {
    const { container, onClose } = setup();
    const [scrim, aside] = Array.from(container.children) as HTMLElement[];
    expect(scrim).toHaveClass('scrim');
    expect(aside.tagName).toBe('ASIDE');
    expect(aside).toHaveClass('drawer');
    expect(aside).toHaveAttribute('data-page', 'S3 事件明細面板');
    expect(aside).toHaveAttribute('data-testid', 'event-drawer');
    expect(screen.getByRole('complementary', { name: '事件明細' })).toBe(aside);
    const sections = Array.from(aside.children) as HTMLElement[];
    expect(sections.map((el) => el.className)).toEqual(['dh', 'db']);
    const [k, x] = Array.from(sections[0].children) as HTMLElement[];
    expect(k).toHaveClass('k');
    expect(k).toHaveTextContent('事件 · 誤走妖魔・魯智深與林沖');
    expect(x).toHaveClass('x');
    expect(x).toHaveTextContent('×');
    expect(screen.getByRole('button', { name: '關閉' })).toBe(x);
    expect(sections[1]).toContainElement(screen.getByRole('heading', { level: 2, name: '大鬧野豬林' }));
    expect(aside.querySelector('.pn')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('DR-P1 S4 params are passed through', () => {
    setup({ page: 'S4 角色資料面板', label: '角色資料', testId: 'character-drawer', kicker: '角色資料' });
    const aside = screen.getByTestId('character-drawer');
    expect(aside).toHaveAttribute('data-page', 'S4 角色資料面板');
    expect(aside).toHaveAttribute('aria-label', '角色資料');
    expect(aside.querySelector('.dh .k')).toHaveTextContent('角色資料');
  });

  it('DR-F1 footer renders in .pn after .db', () => {
    setup({ footer: <button type="button">← 已是第一個</button> });
    const aside = screen.getByTestId('event-drawer');
    expect(Array.from(aside.children).map((el) => el.className)).toEqual(['dh', 'db', 'pn']);
    expect(aside.querySelector('.pn')).toContainElement(screen.getByRole('button', { name: '← 已是第一個' }));
  });

  it('DR-A1 clicking close button calls onClose', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: '關閉' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('DR-A2 clicking scrim calls onClose', async () => {
    const { container, onClose } = setup();
    await userEvent.click(container.querySelector('.scrim') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('DR-A3 pressing Escape calls onClose', async () => {
    const { onClose } = setup();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('DR-A4 other keys do not close', async () => {
    const { onClose } = setup();
    await userEvent.keyboard('{Enter}a');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('DR-A5 clicking inside the drawer does not close', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('heading', { level: 2 }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('DR-A3b Escape uses the latest onClose after rerender', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Drawer {...S3} onClose={first}>x</Drawer>);
    rerender(<Drawer {...S3} onClose={second}>x</Drawer>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('DR-U1 Escape after unmount does not call onClose', () => {
    const { onClose, unmount } = setup();
    unmount();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
