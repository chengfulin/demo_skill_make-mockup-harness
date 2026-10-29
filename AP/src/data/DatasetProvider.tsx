/**
 * 資料 Context（plan「資料存取層」；FR-021、FR-022；AC-S4、AC-S5）。
 *
 * 狀態 loading → ready／error；error 時不提供任何部分資料；`retry` 回到 loading 並重新載入。
 * 載入器可注入（測試以 stub），預設為 `loadDataset(dataBaseUrl)`。
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dataBaseUrl } from '../config';
import type { Dataset } from '../domain/types';
import { loadDataset } from './loadDataset';

export type DatasetLoader = () => Promise<Dataset>;

export type DatasetState =
  | { status: 'loading'; dataset: null }
  | { status: 'error'; dataset: null }
  | { status: 'ready'; dataset: Dataset };

export type DatasetContextValue = DatasetState & { retry: () => void };

const DatasetContext = createContext<DatasetContextValue | null>(null);

const defaultLoader: DatasetLoader = () => loadDataset(dataBaseUrl);

export interface DatasetProviderProps {
  /** 載入器；未提供時讀 `dataBaseUrl` 的 6 個 JSON。須為穩定參照（換參照即重新載入）。 */
  loader?: DatasetLoader;
  children: ReactNode;
}

export function DatasetProvider({ loader = defaultLoader, children }: DatasetProviderProps) {
  const [state, setState] = useState<DatasetState>({ status: 'loading', dataset: null });
  // 每次 retry 遞增，觸發 effect 重新載入。
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    loader().then(
      (dataset) => {
        if (!ignore) setState({ status: 'ready', dataset });
      },
      () => {
        // 細節已由 loadDataset 寫入 console；此處只切換狀態，不保留部分資料。
        if (!ignore) setState({ status: 'error', dataset: null });
      },
    );
    return () => {
      ignore = true;
    };
  }, [loader, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading', dataset: null });
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo<DatasetContextValue>(() => ({ ...state, retry }), [state, retry]);
  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}

export function useDataset(): DatasetContextValue {
  const value = useContext(DatasetContext);
  if (value === null) throw new Error('useDataset 必須在 DatasetProvider 內使用');
  return value;
}
