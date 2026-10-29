/**
 * S4 角色資料內容 CharacterDetail（T100；contracts/ui-contracts.md「S4」；FR-013、FR-014；
 * AC-12、AC-13、AC-P22～AC-P25、AC-S16、AC-S25 的元件層）
 *
 * 介面（T105–T109 依此實作）：
 *   CharacterDetail { character; events?: StoryEvent[]（全書順序）; relations?: RelatedCharacter[];
 *                     onOnlyCharacter?(id); onOpenEvent?(eventId); onOpenCharacter?(id) }
 *     渲染 `.character-detail`（display: contents，不自帶 `.db`；`.db` 由 Drawer 提供）內依序：
 *     身分區 `.cd-head`（CharacterIdentity）→ 狀態 `.sec`（StatusBar，吃 statusSegments／milestones）→
 *     結局 `.sec` → `button.primary`「只看此角色」→ 參與事件 `.sec`（CharacterEvents）→ 人物關係 `.sec`（CharacterRelations）。
 *   RelatedCharacter { character: Character; type: RelationType; note: string }（自 CharacterRelations 匯出）
 * Oracle：真實資料（realDataset）上的 AC 角色與文案。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：林沖（綽號 豹子頭、天雄星・第 6 位・天罡、登場 7／上梁山 11／結局 119、參與事件 10、關係 2）、無操作
 *
 * | 特徵                  | blocks（非 base 者各為一案）                                             | 對應案例        |
 * | :-------------------- | :----------------------------------------------------------------------- | :-------------- |
 * | I1 綽號               | 有（base）／null（高俅：不顯示「綽號」）                                 | CD-I1           |
 * | I2 星號群組           | 一百單八將（base）／其他（晁蓋：「非一百單八將」，AC-12、AC-P22）         | CD-I2           |
 * | M1 節點               | 三個（base）／只有登場（高俅）                                           | CD-M1           |
 * | B1 狀態條             | 四段（晁蓋，AC-P22）／兩段（高俅，AC-P23）／末段已死亡或離散（公孫勝，AC-S16） | CD-B1～CD-B3 |
 * | F1 結局回             | 有（base：「<fate>（第 <n> 回）」）／null（高俅：只有 <fate>）            | CD-F1           |
 * | E1 參與事件章回       | 跨回「a–b回」與單回「n回」並存（base）                                   | BASE            |
 * | R1 關係數             | 多個（base）／0 個（公孫勝：無關係文案）                                 | CD-R1           |
 * | A1 使用者操作         | 無（base）／只看此角色（AC-P25）／點事件／點關係對象（AC-13、AC-P24）    | CD-A1～CD-A3    |
 *
 * 範圍外（一次性宣告）：狀態推算本身（domain `status.test.ts`）；面板殼、Escape／遮罩關閉（`Drawer.test.tsx`、E2E T101）；
 * 「只看此角色」後關面板與篩選結果數（reducer `onlyCharacter`、E2E T101）；關係資料的取得（容器 T110）；
 * 標記位置與色值（純 CSS／inline 百分比，jsdom 不排版；並列比對 E2E）。
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Character } from '../../domain/types';
import { idOf, realDataset } from '../../test-utils/realDataset';
import { CharacterDetail, type CharacterDetailProps } from './CharacterDetail';
import type { RelatedCharacter } from './CharacterRelations';

const { characterById, eventsByCharacter, relations } = realDataset;

function charOf(name: string): Character {
  return characterById.get(idOf(name))!;
}

function relationsOf(id: string): RelatedCharacter[] {
  return relations
    .filter((r) => r.a === id || r.b === id)
    .map((r) => ({ character: characterById.get(r.a === id ? r.b : r.a)!, type: r.type, note: r.note }));
}

function setup(name = '林沖', overrides: Partial<CharacterDetailProps> = {}) {
  const character = charOf(name);
  const handlers = { onOnlyCharacter: vi.fn(), onOpenEvent: vi.fn(), onOpenCharacter: vi.fn() };
  const utils = render(
    <CharacterDetail
      character={character}
      events={eventsByCharacter.get(character.id) ?? []}
      relations={relationsOf(character.id)}
      {...handlers}
      {...overrides}
    />,
  );
  return { ...handlers, ...utils };
}

/** 依小標取區塊（小標含數字者以前綴比對） */
function section(heading: string | RegExp): HTMLElement {
  return screen.getByRole('heading', { name: heading }).closest('.sec') as HTMLElement;
}

const normalize = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').trim();

describe('CharacterDetail', () => {
  it('BASE renders identity, status, fate, only-button, events, relations in order without its own .db', () => {
    const { container } = setup();
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('character-detail');
    expect(container.querySelector('.db')).toBeNull();
    const blocks = Array.from(root.children) as HTMLElement[];
    expect(blocks.map((el) => el.className.split(' ')[0])).toEqual(['cd-head', 'sec', 'sec', 'primary', 'sec', 'sec']);
    expect(blocks[1]).toHaveTextContent('一百二十回中的狀態');
    expect(blocks[2]).toHaveTextContent('結局');
    expect(blocks[3].tagName).toBe('BUTTON');
    expect(blocks[3]).toHaveTextContent('只看此角色');
    expect(blocks[4]).toHaveTextContent('參與事件（10）');
    expect(blocks[5]).toHaveTextContent('人物關係');
  });

  it('BASE identity: h2 name, 綽號 <nickname>, <星號>・第 <座次> 位・<群組>', () => {
    const { container } = setup();
    const head = container.querySelector('.cd-head') as HTMLElement;
    expect(head.querySelector('.av')).toHaveTextContent('林');
    expect(within(head).getByRole('heading', { level: 2 })).toHaveTextContent('林沖');
    const meta = normalize(head.querySelector('.meta')!.textContent);
    expect(meta).toContain('綽號 豹子頭');
    expect(meta).toContain('天雄星・第 6 位・天罡');
    expect(meta).not.toContain('非一百單八將');
  });

  it('BASE status: heading, milestones, role=img bar with aria-label, scale and legend', () => {
    setup();
    const sec = section('一百二十回中的狀態');
    expect(Array.from(sec.querySelectorAll('.stmk')).map((el) => normalize(el.textContent))).toEqual([
      '登場 7',
      '上梁山 11',
      '結局 119',
    ]);
    const bar = within(sec).getByRole('img');
    expect(bar).toHaveAttribute('aria-label', '未登場 6 回，在野 4 回，已上梁山 108 回，已死亡或離散 2 回');
    expect(bar.children).toHaveLength(4);
    expect(Array.from(sec.querySelectorAll('.stscale span')).map((el) => el.textContent)).toEqual([
      '1',
      '30',
      '60',
      '90',
      '120',
    ]);
    expect(Array.from(sec.querySelectorAll('.legend > span')).map((el) => normalize(el.textContent))).toEqual([
      '未登場',
      '在野',
      '已上梁山',
      '已死亡或離散',
    ]);
  });

  it('BASE fate: <fate>（第 <n> 回）', () => {
    setup();
    expect(normalize(section('結局').querySelector('p')!.textContent)).toBe(
      '征方臘後染風病癱瘓，留杭州六和寺由武松看視，半載後亡（第 119 回）',
    );
  });

  it('BASE events: 參與事件（N） rows in book order with short chapter range + title', () => {
    setup();
    const sec = section(/^參與事件（/);
    const buttons = within(sec).getAllByRole('button');
    const expected = eventsByCharacter.get('linchong')!;
    expect(buttons).toHaveLength(10);
    expect(buttons.map((b) => b.querySelector('b')!.textContent)).toEqual(expected.map((e) => e.title));
    const ranges = buttons.map((b) => b.querySelector('span')!.textContent);
    expect(ranges).toContain('8回');
    expect(ranges.some((r) => /^\d+–\d+回$/.test(r ?? ''))).toBe(true);
    const starts = expected.map((e) => e.chapters[0]);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it('BASE relations: buttons with avatar, name, type and title=note', () => {
    setup();
    const sec = section('人物關係');
    const buttons = within(sec).getAllByRole('button');
    expect(buttons).toHaveLength(2);
    const [lu, gao] = buttons;
    expect(lu.querySelector('.av')).toHaveTextContent('魯');
    expect(lu).toHaveTextContent('魯智深');
    expect(lu.querySelector('.rt')).toHaveTextContent('結義');
    expect(lu).toHaveAttribute('title', relationsOf('linchong')[0].note);
    expect(gao).toHaveTextContent('高俅');
    expect(gao.querySelector('.rt')).toHaveTextContent('仇敵');
    expect(within(sec).queryByText('收錄範圍內沒有此角色的關係資料。')).toBeNull();
  });

  it('CD-I1 高俅 (no nickname) shows no 綽號 line', () => {
    const { container } = setup('高俅');
    const meta = normalize(container.querySelector('.cd-head .meta')!.textContent);
    expect(meta).not.toContain('綽號');
    expect(meta).toBe('非一百單八將');
  });

  it('CD-I2 晁蓋 shows 非一百單八將 (AC-12, AC-P22)', () => {
    const { container } = setup('晁蓋');
    const meta = normalize(container.querySelector('.cd-head .meta')!.textContent);
    expect(meta).toContain('綽號 托塔天王');
    expect(meta).toContain('非一百單八將');
    expect(meta).not.toContain('位・');
  });

  it('CD-M1 高俅 has only the 登場 2 milestone', () => {
    setup('高俅');
    const marks = Array.from(section('一百二十回中的狀態').querySelectorAll('.stmk')).map((el) => normalize(el.textContent));
    expect(marks).toEqual(['登場 2']);
  });

  it('CD-B1 晁蓋 bar: 未登場 13 / 在野 6 / 已上梁山 40 / 已死亡或離散 61 (AC-P22)', () => {
    setup('晁蓋');
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      '未登場 13 回，在野 6 回，已上梁山 40 回，已死亡或離散 61 回',
    );
  });

  it('CD-B2 高俅 bar: 未登場 1 / 在野 119 (AC-P23)', () => {
    setup('高俅');
    const bar = screen.getByRole('img');
    expect(bar).toHaveAttribute('aria-label', '未登場 1 回，在野 119 回');
    expect(bar.children).toHaveLength(2);
  });

  it('CD-B3 公孫勝 bar ends with 已死亡或離散 11 回 (AC-S16)', () => {
    setup('公孫勝');
    const label = screen.getByRole('img').getAttribute('aria-label')!;
    expect(label.endsWith('已死亡或離散 11 回')).toBe(true);
  });

  it('CD-F1 高俅 (no fate chapter) shows only the fate text', () => {
    setup('高俅');
    expect(normalize(section('結局').querySelector('p')!.textContent)).toBe(charOf('高俅').fate);
  });

  it('CD-R1 公孫勝 (no relations) shows the empty text', () => {
    setup('公孫勝', { relations: [] });
    const sec = section('人物關係');
    expect(within(sec).queryAllByRole('button')).toHaveLength(0);
    expect(sec).toHaveTextContent('收錄範圍內沒有此角色的關係資料。');
  });

  it('CD-A1 只看此角色 calls onOnlyCharacter with the id (AC-P25)', async () => {
    const { onOnlyCharacter } = setup('魯智深');
    await userEvent.click(screen.getByRole('button', { name: '只看此角色' }));
    expect(onOnlyCharacter).toHaveBeenCalledWith('luzhishen');
  });

  it('CD-A2 clicking an event row calls onOpenEvent with the event id', async () => {
    const { onOpenEvent } = setup();
    const first = eventsByCharacter.get('linchong')![0];
    await userEvent.click(within(section(/^參與事件（/)).getByRole('button', { name: new RegExp(first.title) }));
    expect(onOpenEvent).toHaveBeenCalledWith(first.id);
  });

  it('CD-A3 clicking a relation calls onOpenCharacter with the other id (AC-13, AC-P24)', async () => {
    const { onOpenCharacter } = setup();
    await userEvent.click(within(section('人物關係')).getByRole('button', { name: /魯智深/ }));
    expect(onOpenCharacter).toHaveBeenCalledWith('luzhishen');
  });
});
