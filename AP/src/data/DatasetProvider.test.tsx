/**
 * DatasetProvider／useDataset（T031；plan「資料存取層」；FR-021、FR-022；AC-S4、AC-S5 的元件層基礎）
 *
 * 介面：
 *   <DatasetProvider loader?={() => Promise<Dataset>}>：預設 loader 為 `loadDataset(dataBaseUrl)`；測試注入 stub。
 *   useDataset() → { status: 'loading', dataset: null, retry }
 *                | { status: 'error',   dataset: null, retry }
 *                | { status: 'ready',   dataset: Dataset, retry }
 *   error 時不提供任何部分資料；retry() 回到 loading 並重新呼叫 loader。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：loader 首次即 resolve → loading → ready（dataset 為 loader 結果）
 *
 * | 特徵                     | blocks（非 base 者各為一案）                       | 對應案例    |
 * | :----------------------- | :------------------------------------------------- | :---------- |
 * | L1 loader 結果           | resolve（base）／reject                            | DP-1～DP-2  |
 * | L2 loader 尚未完成       | pending 時為 loading、dataset null                 | DP-0        |
 * | R1 retry 後結果          | 失敗 → retry → 成功／失敗 → retry → 再失敗        | DP-3～DP-4  |
 * | U1 Provider 外使用       | 丟錯                                               | DP-5        |
 *
 * 範圍外（一次性宣告）：預設 loader 的網路行為（loadDataset.test.ts 已驗）；
 * 卸載後 loader 才完成（實作以 ignore 旗標忽略，不另測）。
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Dataset } from '../domain/types';
import { realDataset } from '../test-utils/realDataset';
import { DatasetProvider, useDataset } from './DatasetProvider';

function Probe() {
  const { status, dataset, retry } = useDataset();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="has-dataset">{dataset === null ? 'no' : `events:${dataset.events.length}`}</span>
      <button type="button" onClick={retry}>
        retry
      </button>
    </div>
  );
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('DatasetProvider', () => {
  it('DP-0 loading while loader is pending, without dataset', () => {
    const d = deferred<Dataset>();
    render(
      <DatasetProvider loader={() => d.promise}>
        <Probe />
      </DatasetProvider>,
    );
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    expect(screen.getByTestId('has-dataset')).toHaveTextContent('no');
  });

  it('BASE loader resolves -> ready with dataset', async () => {
    const loader = vi.fn(() => Promise.resolve(realDataset));
    render(
      <DatasetProvider loader={loader}>
        <Probe />
      </DatasetProvider>,
    );
    expect(await screen.findByText('ready')).toBeInTheDocument();
    expect(screen.getByTestId('has-dataset')).toHaveTextContent('events:54');
  });

  it('DP-2 loader rejects -> error, no partial dataset', async () => {
    const loader = vi.fn(() => Promise.reject(new Error('資料載入失敗')));
    render(
      <DatasetProvider loader={loader}>
        <Probe />
      </DatasetProvider>,
    );
    expect(await screen.findByText('error')).toBeInTheDocument();
    expect(screen.getByTestId('has-dataset')).toHaveTextContent('no');
  });

  it('DP-3 retry after failure goes loading then ready', async () => {
    const second = deferred<Dataset>();
    const loader = vi
      .fn<() => Promise<Dataset>>()
      .mockReturnValueOnce(Promise.reject(new Error('x')))
      .mockReturnValueOnce(second.promise);
    render(
      <DatasetProvider loader={loader}>
        <Probe />
      </DatasetProvider>,
    );
    expect(await screen.findByText('error')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'retry' }));
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    expect(loader).toHaveBeenCalledTimes(2);

    await act(async () => second.resolve(realDataset));
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
    expect(screen.getByTestId('has-dataset')).toHaveTextContent('events:54');
  });

  it('DP-4 retry that fails again stays error', async () => {
    const loader = vi.fn(() => Promise.reject(new Error('x')));
    render(
      <DatasetProvider loader={loader}>
        <Probe />
      </DatasetProvider>,
    );
    expect(await screen.findByText('error')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'retry' }));
    expect(await screen.findByText('error')).toBeInTheDocument();
    expect(loader).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('has-dataset')).toHaveTextContent('no');
  });

  it('DP-5 useDataset outside provider throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/DatasetProvider/);
    vi.restoreAllMocks();
  });
});
