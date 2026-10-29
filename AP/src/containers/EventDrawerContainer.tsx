/**
 * S3 事件明細面板容器（T057、T096；contracts/ui-contracts.md「S3」；FR-012、G-2、G-10(a)）。
 * `drawer.kind === 'event'` 時以 `Drawer`（data-page「S3 事件明細面板」、aria-label「事件明細」、
 * data-testid「event-drawer」、類別字「事件 · <大節名>」）包 `EventDetail`；關閉 dispatch `closeDrawer`。
 * 底部 `PrevNextNav` 放在 Drawer 的 `footer`：`prevNext(id, 篩選結果, 全書事件)`（在篩選結果中依結果順序，
 * 否則依全書順序，G-2），切換 dispatch `openEvent`。
 * 參與角色頭像 dispatch `addCharacter`（面板維持開啟，AC-P19）；名字 dispatch `openCharacter`（US5 起顯示角色面板）；
 * 地點 dispatch `goToPlace`（`inShandong` 以 `mapLayout.inScope('sd', place)` 算出，AC-P21、AC-S23）。
 */
import { useCallback, useMemo } from 'react';
import { Drawer } from '../components/Drawer/Drawer';
import { EventDetail } from '../components/EventDetail/EventDetail';
import { PrevNextNav } from '../components/EventDetail/PrevNextNav';
import { participantsOf } from '../components/Timeline/EventCard';
import { useDataset } from '../data/DatasetProvider';
import { inScope } from '../domain/mapLayout';
import { prevNext } from '../domain/navigation';
import type { Chapter } from '../domain/types';
import { useAppDispatch, useAppState } from '../state/AppStateProvider';
import { useFilteredEvents } from '../state/selectors';

export function EventDrawerContainer() {
  const { dataset } = useDataset();
  const { drawer, selected } = useAppState();
  const dispatch = useAppDispatch();
  const filtered = useFilteredEvents();
  const selectedIds = useMemo(() => new Set(selected), [selected]);

  const onClose = useCallback(() => dispatch({ type: 'closeDrawer' }), [dispatch]);
  const onNavigate = useCallback((id: string) => dispatch({ type: 'openEvent', id }), [dispatch]);
  const onAddCharacter = useCallback((id: string) => dispatch({ type: 'addCharacter', id }), [dispatch]);
  const onOpenCharacter = useCallback((id: string) => dispatch({ type: 'openCharacter', id }), [dispatch]);
  const onGoToPlace = useCallback(
    (placeId: string) => {
      const place = dataset?.placeById.get(placeId);
      if (!place) return;
      dispatch({ type: 'goToPlace', placeId, inShandong: inScope('sd', place) });
    },
    [dataset, dispatch],
  );

  if (dataset === null || drawer?.kind !== 'event') return null;
  const event = dataset.eventById.get(drawer.id);
  const arc = event ? dataset.arcById.get(event.arc) : undefined;
  if (!event || !arc) return null;

  const chapters: Chapter[] = [];
  for (let n = event.chapters[0]; n <= event.chapters[1]; n += 1) {
    const ch = dataset.chapterByNo.get(n);
    if (ch) chapters.push(ch);
  }
  const participants = participantsOf(event, dataset.characterById);
  const { prev, next } = prevNext(event.id, filtered, dataset.events);

  return (
    <Drawer
      page="S3 事件明細面板"
      label="事件明細"
      testId="event-drawer"
      kicker={`事件 · ${arc.name}`}
      onClose={onClose}
      footer={<PrevNextNav prev={prev} next={next} onNavigate={onNavigate} />}
    >
      <EventDetail
        event={event}
        arc={arc}
        chapters={chapters}
        participants={participants}
        selectedIds={selectedIds}
        onAddCharacter={onAddCharacter}
        onOpenCharacter={onOpenCharacter}
        onGoToPlace={onGoToPlace}
      />
    </Drawer>
  );
}
