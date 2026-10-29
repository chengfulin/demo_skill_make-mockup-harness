/**
 * App 容器（plan「頁面骨架」「資料存取層」；ui-contracts「頁首」「載入狀態」；FR-022、FR-024）。
 *
 * 頁首永遠渲染；資料 loading／error 時只渲染 LoadState（S1～S6 不渲染、不顯示部分資料，AC-S4／AC-S5），
 * ready 時（T058）依序渲染 Masthead → S1 篩選列 → `<main>`（依 `view`：timeline 為 S2 時間軸；
 * map／graph 在 US1 為空的 `S5 地圖`／`S6 關係圖` 佔位區塊，US6／US7 取代）→ 事件明細面板（`drawer.kind === 'event'`）／角色資料面板（`drawer.kind === 'character'`，T111）。
 * 副標的人物數與事件數由資料計算（不寫死）。
 */
import { LoadState } from './components/LoadState/LoadState';
import { Masthead } from './components/Masthead/Masthead';
import { CharacterDrawerContainer } from './containers/CharacterDrawerContainer';
import { EventDrawerContainer } from './containers/EventDrawerContainer';
import { FilterBarContainer } from './containers/FilterBarContainer';
import { TimelineContainer } from './containers/TimelineContainer';
import { useDataset } from './data/DatasetProvider';
import type { View } from './state/appReducer';
import { useAppState } from './state/AppStateProvider';

function ViewContent({ view }: { view: View }) {
  switch (view) {
    case 'timeline':
      return <TimelineContainer />;
    case 'map':
      return <section className="view" data-page="S5 地圖" />;
    case 'graph':
      return <section className="view" data-page="S6 關係圖" />;
    default: {
      const unhandled: never = view;
      return unhandled;
    }
  }
}

export function App() {
  const data = useDataset();
  const { view, drawer } = useAppState();

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
      <FilterBarContainer />
      <main className="wrap">
        <ViewContent view={view} />
      </main>
      {drawer?.kind === 'event' && <EventDrawerContainer />}
      {drawer?.kind === 'character' && <CharacterDrawerContainer />}
    </>
  );
}
