/**
 * Timeline（S2 時間軸）展示元件測試（T041，US1；測試先行，T048～T052 實作後轉綠）
 *
 * 依據：contracts/ui-contracts.md「S2 時間軸」區塊順序、元件對照、逐字文案與狀態；
 *       Prototype `[P S2-01]`（section#v-timeline[data-page] > .tl-scroll > .tl > .arcs → .ruler → .lanes；
 *       ≤720px 改 .vlist > .vgroup > h3(button + small) → .stack > .vrow(.ch + .ev)）；
 *       Prototype `evCard`（.ev > i.span[.pt] → .t → .m > 章回 + .avs > .av[.ring] + .more）；
 *       spec AC-01、AC-P1、AC-S1、AC-S2、AC-P42（AC-P5 頭像外框為 US2，元件能力在此先驗）。
 *
 * 本測試同時定義 T052 要實作的 props 介面（展示元件只吃 props，plan「元件分層」）：
 *   - `Timeline`（./Timeline）：
 *       { computeLayout: (availableWidth: number) => TimelineLayout;
 *           // 容器傳入：w => timelineLayout(events, arcs, range, w)；Timeline 以 useElementWidth
 *           // 量 tl-scroll 寬後呼叫（未量到時寬為 0，版面取 UNIT_MIN）
 *         events: readonly StoryEvent[];               // 已篩選、全書順序（直向列表分組用）
 *         arcs: readonly Arc[];
 *         characterById: ReadonlyMap<string, Character>;
 *         selectedIds?: ReadonlySet<string>;           // 已選角色（頭像排前、加 .ring 外框）
 *         onOpenEvent: (eventId: string) => void;
 *         onSelectArc?: (arcId: string) => void;       // 色帶按鈕／直向列表組標題按鈕（US3 接上）
 *         empty?: ReactNode }                          // 篩選結果為 0 時取代車道（US2）
 *   - DOM 標記沿用 Prototype class：.arcs／.ruler（.tick、.tick.minor）／.lanes；
 *     事件卡 `button[data-testid="event-card"]` 內 .span（單回加 .pt）、.avs > .av（已選加 .ring）、.more
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：寬螢幕、真實資料 54 事件、range 1–120、未選角色、不點擊、未給 empty
 *
 * | 特徵                  | blocks（非 base 者各為一案）                                 | 對應案例          |
 * | :-------------------- | :----------------------------------------------------------- | :---------------- |
 * | V1 螢幕寬             | 寬（base）／≤720px                                           | TLV-1、TLV-8      |
 * | E1 事件章回           | 跨回（色條）／單回（圓點）                                   | TLV-3、TLV-4      |
 * | E2 參與角色數         | 0（無收錄角色）／≤3（全顯示）／>3（3 個＋「+N」）            | TLV-4、TLV-5、TLV-3 |
 * | S1 已選角色           | 無（base）／有且不在前 3 位                                  | TLV-6             |
 * | N1 事件數             | 54（base）／0（empty 插槽）                                  | TLV-9             |
 * | A1 使用者操作         | 不點擊（base）／點事件卡／點色帶                             | TLV-7、TLV-2      |
 *
 * 範圍外（主要流程外，一次性宣告）：大節 range（版面數值由 timelineLayout.test 驗；E2E 驗 43、50 刻度）；
 * 橫向捲動與實際像素寬（jsdom 無版面；E2E 驗）；色帶交替底色的實際顏色（CSS；alt 標記由 timelineLayout.test 驗）。
 * 數字與中文間的空白為視覺間距（contracts 前言），比對前移除空白。
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { timelineLayout } from '../../domain/timelineLayout';
import type { StoryEvent } from '../../domain/types';
import { arcIdOf, idOf, realDataset } from '../../test-utils/realDataset';
import { Timeline } from './Timeline';

const S2 = 'S2 時間軸';
const { arcs, characterById } = realDataset;

/** 移除所有空白（含 NBSP） */
const squash = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, '');

interface Opts {
  events?: readonly StoryEvent[];
  selectedIds?: ReadonlySet<string>;
  onSelectArc?: (arcId: string) => void;
  empty?: ReactNode;
}

function renderTimeline({ events = realDataset.events, selectedIds, onSelectArc, empty }: Opts = {}) {
  const onOpenEvent = vi.fn();
  const computeLayout = vi.fn((w: number) => timelineLayout(events, arcs, [1, 120], w));
  const utils = render(
    <Timeline
      computeLayout={computeLayout}
      events={events}
      arcs={arcs}
      characterById={characterById}
      selectedIds={selectedIds}
      onOpenEvent={onOpenEvent}
      onSelectArc={onSelectArc}
      empty={empty}
    />,
  );
  const section = utils.container.querySelector<HTMLElement>(`section[data-page="${S2}"]`);
  return { ...utils, section, onOpenEvent, computeLayout };
}

function cardOf(title: string): HTMLElement {
  const card = screen.getAllByTestId('event-card').find((c) => c.textContent?.includes(title));
  if (!card) throw new Error(`找不到事件卡：${title}`);
  return card;
}

/** 讓 `(max-width: 720px)` 成立（其餘 query 不成立） */
function setNarrow() {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    ...original(query),
    matches: /max-width:\s*720px/.test(query),
  })) as typeof window.matchMedia;
}

const follows = (a: Node, b: Node) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('Timeline wide screen (S2)', () => {
  // TLV-1（base）：根元素、tl-scroll 內 色帶 → 刻度 → 車道，54 張事件卡（AC-01）
  it('TLV-1 renders section, bands -> ruler -> lanes, 54 event cards', () => {
    const { section, computeLayout } = renderTimeline();
    expect(section).not.toBeNull();
    expect(section!.tagName).toBe('SECTION');
    expect(computeLayout).toHaveBeenCalled();

    const tl = within(section!).getByTestId('timeline');
    expect(tl).toHaveClass('tl-scroll');
    const bands = tl.querySelector('.arcs');
    const ruler = tl.querySelector('.ruler');
    const lanes = tl.querySelector('.lanes');
    expect(bands).not.toBeNull();
    expect(ruler).not.toBeNull();
    expect(lanes).not.toBeNull();
    expect(follows(bands!, ruler!)).toBe(true);
    expect(follows(ruler!, lanes!)).toBe(true);

    const cards = within(lanes as HTMLElement).getAllByTestId('event-card');
    expect(cards).toHaveLength(54);
    cards.forEach((c) => expect(c.tagName).toBe('BUTTON'));
    expect(screen.queryByTestId('timeline-list')).toBeNull();
  });

  // TLV-2：12 條大節色帶（AC-P1），每段為按鈕「<大節名> ／ <a>–<b>」；刻度數字 1、10…120
  it('TLV-2 renders 12 arc band buttons and labelled ticks; band click selects arc', async () => {
    const onSelectArc = vi.fn();
    renderTimeline({ onSelectArc });
    const tl = screen.getByTestId('timeline');
    const bandButtons = within(tl.querySelector<HTMLElement>('.arcs')!).getAllByRole('button');
    expect(bandButtons).toHaveLength(12);
    expect(squash(bandButtons[4]!.textContent)).toBe('三打祝家莊43–50');

    const labels = [...tl.querySelectorAll('.ruler .tick')]
      .map((t) => squash(t.textContent))
      .filter(Boolean);
    expect(labels).toEqual(['1', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110', '120']);
    expect(tl.querySelectorAll('.ruler .tick.minor').length).toBe(12);

    await userEvent.click(bandButtons[4]!);
    expect(onSelectArc).toHaveBeenCalledWith(arcIdOf('三打祝家莊'));
  });

  // TLV-3：跨回（14–15）、5 位角色 → 色條、「第 14–15 回」、3 個頭像＋「+2」（AC-S2）
  it('TLV-3 multi-chapter card with >3 characters: bar, range, 3 avatars and +N', () => {
    renderTimeline();
    const card = cardOf('七星聚義');
    expect(squash(card.textContent)).toContain('第14–15回');
    const span = card.querySelector('.span');
    expect(span).not.toBeNull();
    expect(span).not.toHaveClass('pt');
    const avs = card.querySelectorAll('.avs .av');
    expect(avs).toHaveLength(3);
    expect([...avs].map((a) => a.textContent)).toEqual(['晁', '吳', '公']);
    expect(squash(card.querySelector('.more')?.textContent)).toBe('+2');
  });

  // TLV-4：單回（第 1 回）、無角色 → 圓點、「第 1 回」、「（無收錄角色）」、無頭像
  it('TLV-4 single-chapter card without characters: dot and placeholder text', () => {
    renderTimeline();
    const card = cardOf('洪太尉誤走妖魔');
    expect(squash(card.textContent)).toContain('第1回');
    expect(card.querySelector('.span')).toHaveClass('pt');
    expect(card.querySelectorAll('.av')).toHaveLength(0);
    expect(card).toHaveTextContent('（無收錄角色）');
  });

  // TLV-5：≤3 位角色 → 全部頭像、無「+N」、無「（無收錄角色）」
  it('TLV-5 card with <=3 characters shows all avatars and no +N', () => {
    renderTimeline();
    const card = cardOf('倒拔垂楊柳・林沖結義'); // 第 7 回：魯智深、林沖
    expect(card.querySelectorAll('.avs .av')).toHaveLength(2);
    expect(card.textContent).not.toMatch(/\+\d/);
    expect(card).not.toHaveTextContent('（無收錄角色）');
  });

  // TLV-6：已選角色（阮小七，原排第 5 位）頭像排前並帶 .ring 外框（AC-P5 元件能力）
  it('TLV-6 selected character avatar moves to front with ring', () => {
    renderTimeline({ selectedIds: new Set([idOf('阮小七')]) });
    const avs = [...cardOf('七星聚義').querySelectorAll('.avs .av')];
    expect(avs).toHaveLength(3);
    expect(avs[0]!.textContent).toBe('七');
    expect(avs[0]).toHaveClass('ring');
    expect(avs.filter((a) => a.classList.contains('ring'))).toHaveLength(1);
  });

  // TLV-7：點事件卡 → onOpenEvent(事件 id)
  it('TLV-7 clicking a card calls onOpenEvent with the event id', async () => {
    const { onOpenEvent } = renderTimeline();
    await userEvent.click(cardOf('七星聚義'));
    expect(onOpenEvent).toHaveBeenCalledWith('ev-10');
  });

  // TLV-9：結果為 0 → empty 插槽取代車道，色帶與刻度保留
  it('TLV-9 empty slot replaces lanes when there are no events', () => {
    renderTimeline({ events: [], empty: <p data-testid="empty-slot">沒有符合條件的事件</p> });
    const tl = screen.getByTestId('timeline');
    expect(within(tl).getByTestId('empty-slot')).toBeInTheDocument();
    expect(tl.querySelector('.lanes')).toBeNull();
    expect(screen.queryAllByTestId('event-card')).toHaveLength(0);
    expect(tl.querySelector('.arcs')).not.toBeNull();
    expect(tl.querySelector('.ruler')).not.toBeNull();
  });
});

describe('Timeline narrow screen (<=720px, AC-P42)', () => {
  // TLV-8：改渲染 timeline-list，依大節分組：標題（大節名按鈕＋「第 a–b 回」）→ 事件列（章回＋事件卡）
  it('TLV-8 renders timeline-list grouped by arc instead of the horizontal timeline', async () => {
    setNarrow();
    const onSelectArc = vi.fn();
    const { section } = renderTimeline({ onSelectArc });
    expect(within(section!).queryByTestId('timeline')).toBeNull();
    const list = within(section!).getByTestId('timeline-list');

    const headings = within(list).getAllByRole('heading');
    expect(headings).toHaveLength(12);
    const first = headings[0]!;
    const arcButton = within(first).getByRole('button');
    expect(arcButton).toHaveTextContent('誤走妖魔・魯智深與林沖');
    expect(squash(first.textContent)).toContain('第1–12回');

    expect(within(list).getAllByTestId('event-card')).toHaveLength(54);
    // 事件列章回欄：單回「1」、跨回「14–15」，位於該列事件卡之前
    const rowOf = (title: string) => cardOf(title).parentElement!;
    const chText = (title: string) =>
      squash(rowOf(title).textContent).replace(squash(cardOf(title).textContent), '');
    expect(chText('洪太尉誤走妖魔')).toBe('1');
    expect(chText('七星聚義')).toBe('14–15');

    await userEvent.click(arcButton);
    expect(onSelectArc).toHaveBeenCalledWith(arcIdOf('誤走妖魔・魯智深與林沖'));
  });
});
