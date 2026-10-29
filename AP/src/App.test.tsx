/**
 * App 骨架（T037；ui-contracts「頁首」「載入狀態」；FR-022、FR-024；AC-S4、AC-S5 的元件層）
 *
 * 介面：<DatasetProvider loader={stub}><AppStateProvider><App /></AppStateProvider></DatasetProvider>
 *   App 永遠渲染 Masthead；status 為 loading／error 時只渲染 LoadState（不渲染 <main> 與任何 data-page 區塊）；
 *   ready 時渲染 <main>，Masthead 副標帶資料計算的人物數與事件數。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：loader 首次即 resolve（真實資料）→ ready
 *
 * | 特徵                  | blocks（非 base 者各為一案）                          | 對應案例  |
 * | :-------------------- | :---------------------------------------------------- | :-------- |
 * | D1 載入狀態           | ready（base）／loading（pending）／error（reject）   | APP-1～2  |
 * | R1 失敗後重試結果     | 重試 → 成功                                           | APP-3     |
 * | C1 副標的數字來源     | 真實資料 22／54（base）／合成資料不同筆數             | APP-4     |
 *
 * 範圍外（一次性宣告）：重試後再失敗（DatasetProvider.test DP-4 已驗）；
 * 「共 54 個事件」結果數（FilterBar 於 US1 起接入，由 E2E 驗）；hash 初始視圖（T046）；
 * main.tsx 的樣式載入與掛載（E2E 與 build 驗）。
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { DatasetProvider, type DatasetLoader } from './data/DatasetProvider';
import type { Dataset } from './domain/types';
import { AppStateProvider } from './state/AppStateProvider';
import { realDataset } from './test-utils/realDataset';

const SUBTITLE_PREFIX = '依百二十回本《水滸全傳》章回';

function renderApp(loader: DatasetLoader) {
  return render(
    <DatasetProvider loader={loader}>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </DatasetProvider>,
  );
}

function expectMastheadTitle() {
  const header = screen.getByRole('banner');
  expect(within(header).getByRole('heading', { level: 1 })).toHaveTextContent('水滸時間軸');
  return header;
}

function expectNoContent(container: HTMLElement) {
  expect(screen.queryByRole('main')).toBeNull();
  expect(container.querySelector('[data-page]')).toBeNull();
}

describe('App', () => {
  it('BASE ready renders masthead with verbatim subtitle and main, no load state', async () => {
    renderApp(() => Promise.resolve(realDataset));
    expect(await screen.findByRole('main')).toBeInTheDocument();
    const header = expectMastheadTitle();
    expect(within(header).getByText(`${SUBTITLE_PREFIX} · 收錄 22 位人物、54 件事`)).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).toBeNull();
    expect(screen.queryByTestId('load-error')).toBeNull();
  });

  it('APP-1 loading shows masthead and loading hint only (AC-S4)', () => {
    const { container } = renderApp(() => new Promise<Dataset>(() => {}));
    const header = expectMastheadTitle();
    expect(within(header).queryByText(new RegExp(SUBTITLE_PREFIX))).toBeNull();
    expect(screen.getByTestId('loading')).toHaveTextContent('資料載入中…');
    expectNoContent(container);
  });

  it('APP-2 error shows masthead and error with retry, no partial data (AC-S5)', async () => {
    const { container } = renderApp(() => Promise.reject(new Error('stub failure')));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveAttribute('data-testid', 'load-error');
    expect(alert).toHaveTextContent('資料載入失敗，請稍後再試。');
    expect(within(alert).getByRole('button', { name: '重試' })).toBeInTheDocument();
    const header = expectMastheadTitle();
    expect(within(header).queryByText(new RegExp(SUBTITLE_PREFIX))).toBeNull();
    expect(screen.queryByTestId('loading')).toBeNull();
    expectNoContent(container);
  });

  it('APP-3 retry after failure loads successfully (AC-S5)', async () => {
    const loader = vi
      .fn<DatasetLoader>()
      .mockRejectedValueOnce(new Error('stub failure'))
      .mockResolvedValueOnce(realDataset);
    renderApp(loader);
    await userEvent.click(await screen.findByRole('button', { name: '重試' }));
    expect(await screen.findByRole('main')).toBeInTheDocument();
    expect(loader).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('banner')).toHaveTextContent('收錄 22 位人物、54 件事');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByTestId('loading')).toBeNull();
  });

  it('APP-4 subtitle counts come from the dataset, not hard-coded', async () => {
    const dataset: Dataset = {
      ...realDataset,
      characters: realDataset.characters.slice(0, 3),
      events: realDataset.events.slice(0, 5),
    };
    renderApp(() => Promise.resolve(dataset));
    await screen.findByRole('main');
    expect(screen.getByRole('banner')).toHaveTextContent(`${SUBTITLE_PREFIX} · 收錄 3 位人物、5 件事`);
  });
});
