/**
 * S3 事件明細內容 EventDetail ＋ 底部 PrevNextNav（T087；contracts/ui-contracts.md「S3」；FR-012；
 * AC-10、AC-11、AC-P18、AC-P19、AC-P21、AC-S15、AC-S26、AC-S27 的元件層）
 *
 * 介面：
 *   EventDetail { event; arc; chapters?: Chapter[]; participants?: Character[]; selectedIds?: ReadonlySet<string>;
 *                 onAddCharacter?(id); onOpenCharacter?(id); onGoToPlace?(placeId) }
 *     渲染 `.event-detail`（display: contents，不自帶 `.db`；`.db` 由 Drawer 提供）內依序：
 *     標題區 `.ed-head`（h2＋中繼）→ 摘要 `p.summary` → 回目 `.sec` → 地點 `.sec` → 參與角色 `.sec`。
 *   PrevNextNav { prev: StoryEvent | null; next: StoryEvent | null; onNavigate(id) }
 *     兩個按鈕（由容器放進 Drawer 的 `footer` → `.pn`）：「← <前一事件名>」「<下一事件名> →」，
 *     null 時停用並顯示「← 已是第一個」「已是最後一個 →」。
 * Oracle：真實資料（realDataset）上的 AC 事件與文案。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：「大鬧野豬林」（第 8 回、地點可定位、魯智深＋林沖 2 位）、未選角色、無操作
 *
 * | 特徵                  | blocks（非 base 者各為一案）                                   | 對應案例        |
 * | :-------------------- | :------------------------------------------------------------- | :-------------- |
 * | E1 章回數             | 單回（base）／多回（28–31 回 4 條，AC-P18、AC-10）             | ED-E1           |
 * | E2 地點               | 可定位按鈕（base）／不可定位徽章（還道村，AC-S27）            | ED-E2           |
 * | E3 參與角色數         | 多位（base）／0 位（洪太尉誤走妖魔）                           | ED-E3           |
 * | S1 已選角色           | 無（base）／部分已選（林沖：外框＋「已在篩選中」，AC-P19 前提） | ED-S1           |
 * | A1 使用者操作         | 無（base）／點頭像（AC-11）／點名字／點地點（AC-P21）          | ED-A1～ED-A3    |
 * | N1 上一個／下一個     | 兩者皆有（AC-P20）／首個（AC-S26）／末個（AC-S15）            | PN-1～PN-3      |
 * | N2 導覽操作           | 點上一個／點下一個／點停用鈕不觸發                             | PN-4～PN-5      |
 *
 * 範圍外（一次性宣告）：prev／next 的計算（domain `navigation.test.ts`）；加入篩選後面板維持開啟、地點切地圖與
 * 關面板（reducer `addCharacter`／`goToPlace` 與容器，T086、T096，E2E T088）；Drawer 殼（`Drawer.test.tsx`）；
 * 停用透明度 .4 與版面（純 CSS，jsdom 不排版）。
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Chapter, StoryEvent } from '../../domain/types';
import { idOf, realDataset } from '../../test-utils/realDataset';
import { participantsOf } from '../Timeline/EventCard';
import { EventDetail, type EventDetailProps } from './EventDetail';
import { PrevNextNav } from './PrevNextNav';

const { events, arcById, chapterByNo, characterById } = realDataset;

function eventOf(title: string): StoryEvent {
  const e = events.find((ev) => ev.title === title);
  if (!e) throw new Error(`realDataset 找不到事件：${title}`);
  return e;
}

function chaptersOf(e: StoryEvent): Chapter[] {
  const out: Chapter[] = [];
  for (let n = e.chapters[0]; n <= e.chapters[1]; n++) {
    const c = chapterByNo.get(n);
    if (c) out.push(c);
  }
  return out;
}

function setup(title = '大鬧野豬林', overrides: Partial<EventDetailProps> = {}) {
  const event = eventOf(title);
  const handlers = { onAddCharacter: vi.fn(), onOpenCharacter: vi.fn(), onGoToPlace: vi.fn() };
  const utils = render(
    <EventDetail
      event={event}
      arc={arcById.get(event.arc)!}
      chapters={chaptersOf(event)}
      participants={participantsOf(event, characterById)}
      {...handlers}
      {...overrides}
    />,
  );
  return { ...handlers, ...utils };
}

/** 依小標取區塊 */
function section(heading: string): HTMLElement {
  return screen.getByRole('heading', { name: heading }).closest('.sec') as HTMLElement;
}

describe('EventDetail', () => {
  it('BASE renders head, summary, chapters, place, participants in order without its own .db', () => {
    const { container } = setup();
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('event-detail');
    // .db 由 Drawer 提供，本元件不得再輸出一層（前輪審查建議）
    expect(container.querySelector('.db')).toBeNull();
    const blocks = Array.from(root.children) as HTMLElement[];
    expect(blocks.map((el) => el.className)).toEqual(['ed-head', 'summary', 'sec', 'sec', 'sec']);
    expect(within(blocks[0]).getByRole('heading', { level: 2 })).toHaveTextContent('大鬧野豬林');
    expect(blocks[0]).toHaveTextContent('第 8 回大節 誤走妖魔・魯智深與林沖');
    expect(blocks[1]).toHaveTextContent('公人欲在野豬林謀害林沖，魯智深暗中跟隨及時相救。');
    expect(blocks.slice(2).map((el) => el.querySelector('h4')?.textContent)).toEqual([
      '回目',
      '地點',
      '參與角色',
    ]);

    const items = within(section('回目')).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(['第八回林教頭刺配滄州道 魯智深大鬧野豬林']);

    expect(within(section('地點')).getByRole('button')).toHaveTextContent('野豬林 · 在地圖上看');

    const people = section('參與角色');
    expect(within(people).getByRole('button', { name: '將 魯智深 加入篩選' })).toHaveAttribute(
      'title',
      '加入篩選',
    );
    expect(within(people).getByRole('button', { name: '將 林沖 加入篩選' })).toHaveAttribute(
      'title',
      '加入篩選',
    );
    const rows = Array.from(people.querySelectorAll('.person'));
    expect(rows.map((r) => r.textContent)).toEqual(['魯魯智深花和尚', '林林沖豹子頭']);
    expect(people).not.toHaveTextContent('已在篩選中');
    expect(people.querySelectorAll('.ring')).toHaveLength(0);
    expect(people.querySelector('p.hint')).toHaveTextContent('點頭像加入篩選，點名字看角色資料。');
  });

  it('ED-E1 multi-chapter event lists each chapter (28-31: 4 rows, AC-P18)', () => {
    setup('醉打蔣門神・血濺鴛鴦樓');
    expect(screen.getByRole('heading', { level: 2 }).parentElement).toHaveTextContent('第 28–31 回');
    const items = within(section('回目')).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items.map((li) => li.querySelector('span')?.textContent)).toEqual([
      '第二十八回',
      '第二十九回',
      '第三十回',
      '第三十一回',
    ]);
    expect(within(section('地點')).getByRole('button')).toHaveTextContent('孟州 · 在地圖上看');
    expect(within(section('參與角色')).getByRole('button', { name: '武松' })).toBeInTheDocument();
  });

  it('ED-E2 unlocatable place renders a badge without the map button (AC-S27)', () => {
    setup('九天玄女授天書');
    const place = section('地點');
    expect(within(place).queryByRole('button')).toBeNull();
    expect(place.querySelector('.badge')).toHaveTextContent('還道村（無法在示意地圖上定位）');
    expect(place).not.toHaveTextContent('在地圖上看');
  });

  it('ED-E3 event without characters shows the empty hint only', () => {
    setup('洪太尉誤走妖魔');
    const people = section('參與角色');
    expect(within(people).queryAllByRole('button')).toHaveLength(0);
    expect(people.querySelector('p.hint')).toHaveTextContent('本事件沒有收錄名單中的角色。');
    expect(people).not.toHaveTextContent('點頭像加入篩選');
  });

  it('ED-S1 selected participant gets ring and 已在篩選中', () => {
    setup('大鬧野豬林', { selectedIds: new Set([idOf('林沖')]) });
    const rows = Array.from(section('參與角色').querySelectorAll('.person')) as HTMLElement[];
    const [lu, lin] = rows;
    expect(lin).toHaveTextContent('已在篩選中');
    expect(lin.querySelector('.av')).toHaveClass('ring');
    expect(lu).not.toHaveTextContent('已在篩選中');
    expect(lu.querySelector('.av')).not.toHaveClass('ring');
  });

  it('ED-A1 clicking an avatar calls onAddCharacter with the id (AC-11)', async () => {
    const { onAddCharacter, onOpenCharacter } = setup();
    await userEvent.click(screen.getByRole('button', { name: '將 魯智深 加入篩選' }));
    expect(onAddCharacter).toHaveBeenCalledExactlyOnceWith(idOf('魯智深'));
    expect(onOpenCharacter).not.toHaveBeenCalled();
  });

  it('ED-A2 clicking a name calls onOpenCharacter with the id', async () => {
    const { onAddCharacter, onOpenCharacter } = setup();
    await userEvent.click(screen.getByRole('button', { name: '林沖' }));
    expect(onOpenCharacter).toHaveBeenCalledExactlyOnceWith(idOf('林沖'));
    expect(onAddCharacter).not.toHaveBeenCalled();
  });

  it('ED-A3 clicking the place button calls onGoToPlace with the place id (AC-P21)', async () => {
    const { onGoToPlace } = setup();
    await userEvent.click(screen.getByRole('button', { name: '野豬林 · 在地圖上看' }));
    expect(onGoToPlace).toHaveBeenCalledExactlyOnceWith('野豬林');
  });
});

describe('PrevNextNav', () => {
  function renderNav(prev: StoryEvent | null, next: StoryEvent | null) {
    const onNavigate = vi.fn();
    render(
      <div className="pn">
        <PrevNextNav prev={prev} next={next} onNavigate={onNavigate} />
      </div>,
    );
    const [prevBtn, nextBtn] = screen.getAllByRole('button');
    return { onNavigate, prevBtn, nextBtn };
  }

  it('PN-1 both present: "← <prev>" and "<next> →" enabled (AC-P20)', () => {
    const { prevBtn, nextBtn } = renderNav(eventOf('林沖誤入白虎堂'), eventOf('棒打洪教頭'));
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(prevBtn).toHaveTextContent('← 林沖誤入白虎堂');
    expect(nextBtn).toHaveTextContent('棒打洪教頭 →');
    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeEnabled();
  });

  it('PN-2 first: prev disabled with 已是第一個 (AC-S26)', () => {
    const { prevBtn, nextBtn } = renderNav(null, eventOf('林沖誤入白虎堂'));
    expect(prevBtn).toHaveTextContent('← 已是第一個');
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toHaveTextContent('林沖誤入白虎堂 →');
    expect(nextBtn).toBeEnabled();
  });

  it('PN-3 last: next disabled with 已是最後一個 (AC-S15)', () => {
    const { prevBtn, nextBtn } = renderNav(eventOf('眾將散去'), null);
    expect(nextBtn).toHaveTextContent('已是最後一個 →');
    expect(nextBtn).toBeDisabled();
    expect(prevBtn).toHaveTextContent('← 眾將散去');
  });

  it('PN-4 clicking prev / next calls onNavigate with the event id', async () => {
    const prev = eventOf('林沖誤入白虎堂');
    const next = eventOf('棒打洪教頭');
    const { onNavigate, prevBtn, nextBtn } = renderNav(prev, next);
    await userEvent.click(nextBtn);
    expect(onNavigate).toHaveBeenLastCalledWith(next.id);
    await userEvent.click(prevBtn);
    expect(onNavigate).toHaveBeenLastCalledWith(prev.id);
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });

  it('PN-5 clicking a disabled button does not navigate', async () => {
    const { onNavigate, prevBtn } = renderNav(null, eventOf('林沖誤入白虎堂'));
    await userEvent.click(prevBtn);
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
