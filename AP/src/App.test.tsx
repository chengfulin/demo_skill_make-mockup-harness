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
 * | V1 初始 hash（T046）  | 無 hash（base）／#map／#graph                         | APP-5～6  |
 * | I1 ready 互動（T058） | 切視圖分頁寫回 hash／點事件卡開面板、關閉鈕關面板      | APP-6～7  |
 *
 * ready 時（T058）：S1 篩選列（結果數「共 54 個事件」）→ main（S2 時間軸、S5 地圖（T127），或 S6 佔位）→ 事件明細面板。
 *
 * 範圍外（一次性宣告）：重試後再失敗（DatasetProvider.test DP-4 已驗）；
 * 無法辨識 hash 的解析與 hashchange 同步（useHashView.test 已驗）；
 * 時間軸版面與事件卡內容（timelineLayout.test、Timeline.test 已驗）；
 * main.tsx 的樣式載入與掛載（E2E 與 build 驗）。
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

const readyLoader: DatasetLoader = () => Promise.resolve(realDataset);

function setHash(hash: string) {
  window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
}

afterEach(() => setHash(''));

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

  it('APP-5 ready without hash renders S1 result count and S2 timeline, hash becomes #timeline', async () => {
    const { container } = renderApp(readyLoader);
    const main = await screen.findByRole('main');
    expect(container.querySelector('[data-page="S1 角色篩選列"]')).not.toBeNull();
    expect(screen.getByTestId('result-count')).toHaveTextContent(/共\s*54\s*個事件/);
    expect(main.querySelector('[data-page="S2 時間軸"]')).not.toBeNull();
    expect(within(main).getAllByTestId('event-card')).toHaveLength(54);
    expect(screen.getByRole('tab', { name: '時間軸' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByTestId('event-drawer')).toBeNull();
    expect(window.location.hash).toBe('#timeline');
  });

  it('APP-6 initial #map shows the S5 map; switching tabs writes the hash', async () => {
    setHash('#map');
    const { container } = renderApp(readyLoader);
    const main = await screen.findByRole('main');
    expect(main.querySelector('[data-page="S5 地圖"]')).not.toBeNull();
    expect(container.querySelector('[data-page="S2 時間軸"]')).toBeNull();
    expect(screen.getByRole('tab', { name: '地圖' })).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(screen.getByRole('tab', { name: '關係圖' }));
    expect(main.querySelector('[data-page="S6 關係圖"]')).not.toBeNull();
    expect(main.querySelector('[data-page="S5 地圖"]')).toBeNull();
    expect(window.location.hash).toBe('#graph');

    await userEvent.click(screen.getByRole('tab', { name: '時間軸' }));
    expect(main.querySelector('[data-page="S2 時間軸"]')).not.toBeNull();
    expect(window.location.hash).toBe('#timeline');
  });

  it('APP-7 clicking an event card opens S3 event drawer; close button closes it', async () => {
    renderApp(readyLoader);
    await screen.findByRole('main');
    const card = screen
      .getAllByTestId('event-card')
      .find((el) => within(el).queryByText('智取生辰綱', { exact: true }) !== null);
    expect(card).toBeDefined();
    await userEvent.click(card!);
    const drawer = screen.getByTestId('event-drawer');
    expect(drawer).toHaveAttribute('data-page', 'S3 事件明細面板');
    expect(drawer).toHaveAttribute('aria-label', '事件明細');
    expect(within(drawer).getByRole('heading', { level: 2 })).toHaveTextContent('智取生辰綱');
    const arcName = realDataset.arcById.get(realDataset.eventById.get('ev-11')!.arc)!.name;
    expect(within(drawer).getByText(`事件 · ${arcName}`)).toBeInTheDocument();

    await userEvent.click(within(drawer).getByRole('button', { name: '關閉' }));
    expect(screen.queryByTestId('event-drawer')).toBeNull();
  });
});
