/**
 * S3 事件明細面板容器（T057；contracts/ui-contracts.md「S3」）。
 * `drawer.kind === 'event'` 時以 `Drawer`（data-page「S3 事件明細面板」、aria-label「事件明細」、
 * data-testid「event-drawer」、類別字「事件 · <大節名>」）包 `EventDetail`；關閉 dispatch `closeDrawer`。
 * 上一個／下一個、加入篩選、地點切地圖於 US4（T096）擴充。
 */
import { useCallback } from 'react';
import { Drawer } from '../components/Drawer/Drawer';
import { EventDetail } from '../components/EventDetail/EventDetail';
import { useDataset } from '../data/DatasetProvider';
import { useAppDispatch, useAppState } from '../state/AppStateProvider';

export function EventDrawerContainer() {
  const { dataset } = useDataset();
  const { drawer } = useAppState();
  const dispatch = useAppDispatch();
  const onClose = useCallback(() => dispatch({ type: 'closeDrawer' }), [dispatch]);

  if (dataset === null || drawer?.kind !== 'event') return null;
  const event = dataset.eventById.get(drawer.id);
  const arc = event ? dataset.arcById.get(event.arc) : undefined;
  if (!event || !arc) return null;

  return (
    <Drawer
      page="S3 事件明細面板"
      label="事件明細"
      testId="event-drawer"
      kicker={`事件 · ${arc.name}`}
      onClose={onClose}
    >
      <EventDetail event={event} arc={arc} />
    </Drawer>
  );
}
