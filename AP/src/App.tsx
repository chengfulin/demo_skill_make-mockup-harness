/**
 * App 容器（plan「頁面骨架」「資料存取層」；ui-contracts「頁首」「載入狀態」；FR-022、FR-024）。
 *
 * 頁首永遠渲染；資料 loading／error 時只渲染 LoadState（S1～S6 不渲染、不顯示部分資料，AC-S4／AC-S5），
 * ready 時渲染 `<main>`（內容由 US1 起逐步填入）。副標的人物數與事件數由資料計算（不寫死）。
 */
import { LoadState } from './components/LoadState/LoadState';
import { Masthead } from './components/Masthead/Masthead';
import { useDataset } from './data/DatasetProvider';

export function App() {
  const data = useDataset();

  if (data.status !== 'ready') {
    return (
      <>
        <Masthead counts={null} />
        <div className="wrap">
          {data.status === 'loading' ? (
            <LoadState status="loading" />
          ) : (
            <LoadState status="error" onRetry={data.retry} />
          )}
        </div>
      </>
    );
  }

  const { dataset } = data;
  return (
    <>
      <Masthead counts={{ characters: dataset.characters.length, events: dataset.events.length }} />
      <main className="wrap" />
    </>
  );
}
