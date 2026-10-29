/**
 * S1 角色篩選元件（T063，US2）：SearchBox、GroupToggle、CharacterChip、CharacterList、SelectedTags
 *
 * 依據：contracts/ui-contracts.md「S1 角色篩選列」逐字文案與狀態；Prototype `[P S1-01]`～`[P S1-04]`
 *       （index.html：label.search > svg ＋ input#q；button.tog > span.dot；.chip(.on) > button.pick[aria-pressed]
 *       > .av ＋ .nm ＋ .nk、button.info；.empty-note；.sel > .label、.tag > button[aria-label]、button.link）；
 *       spec FR-009、FR-010、AC-S12（資料鈕不改變選取）。
 *
 * 本測試定義展示元件的 props 介面（plan「元件分層」：只吃 props，不碰 state／資料）：
 *   - `SearchBox`：{ value: string; onChange: (q: string) => void; onSubmit: () => void }
 *   - `GroupToggle`：{ group: '天罡' | '地煞'; pressed: boolean; onToggle: () => void }
 *   - `CharacterChip`：{ character: Character; selected: boolean; onToggle: (id) => void; onInfo?: (id) => void }
 *   - `CharacterList`：{ characters: readonly Character[]（已篩、依資料順序）; selectedIds: ReadonlySet<string>;
 *                        onToggle: (id) => void; onInfo?: (id) => void }
 *   - `SelectedTags`（T071）：{ characters: readonly Character[]（已選、依加入順序）; onRemove: (id) => void; onClear: () => void }
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：林沖 chip、未選、未提供 onInfo；搜尋框空值；天罡未全選；清單 22 位；已選 0 位
 *
 * | 特徵                    | blocks（非 base 者各為一案）                          | 對應案例        |
 * | :---------------------- | :---------------------------------------------------- | :-------------- |
 * | B1 搜尋框操作           | 無（base，結構與文案）／輸入字元／按 Enter            | SB-1～SB-3      |
 * | T1 快選群組             | 天罡（base）／地煞                                    | GT-1、GT-3      |
 * | T2 快選狀態             | 未全選（base）／已全選；點擊                          | GT-1～GT-2      |
 * | C1 chip 選取            | 未選（base）／已選                                    | CC-1～CC-2      |
 * | C2 主綽號               | 有（base）／無（高俅）                                | CC-3            |
 * | C3 資料鈕               | 未提供 onInfo（base）／提供（點擊不觸發 onToggle）    | CC-4～CC-5      |
 * | L1 清單筆數             | 多筆（base，依輸入順序）／0（找不到符合的角色）       | CL-1～CL-2      |
 * | S1 已選數               | 0（未選文案）／多（依加入順序、移除、清除全部）       | ST-1～ST-3      |
 *
 * 範圍外（一次性宣告）：樣式色值（Prototype 並列比對 E2E 驗）；即打即篩的比對規則（domain/search.test.ts 驗）；
 * IME 組字中的 Enter（不觸發 onSubmit，屬瀏覽器行為，不在 jsdom 驗）。
 */
import type { ReactElement } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { realDataset } from '../../test-utils/realDataset';
import type { Character } from '../../domain/types';
import { CharacterChip } from './CharacterChip';
import { CharacterList } from './CharacterList';
import { GroupToggle } from './GroupToggle';
import { SearchBox } from './SearchBox';

const byName = (name: string): Character => {
  const c = realDataset.characters.find((ch) => ch.name === name);
  if (!c) throw new Error(name);
  return c;
};
const linchong = byName('林沖');
const gaoqiu = byName('高俅');

describe('SearchBox', () => {
  it('SB-1 BASE input type=search with placeholder, aria-label and a magnifier svg', () => {
    const { container } = render(<SearchBox value="" onChange={vi.fn()} onSubmit={vi.fn()} />);
    const input = screen.getByRole('searchbox', { name: '搜尋角色' });
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('placeholder', '搜尋姓名或綽號，例如：黑旋風');
    expect(input).toHaveValue('');
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    // 放大鏡在輸入框之前（左側）
    expect(svg!.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('SB-2 typing calls onChange with the new text (filter as you type)', () => {
    const onChange = vi.fn();
    render(<SearchBox value="" onChange={onChange} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '豹子頭' } });
    expect(onChange).toHaveBeenCalledWith('豹子頭');
  });

  it('SB-3 Enter calls onSubmit; other keys do not', async () => {
    const onSubmit = vi.fn();
    render(<SearchBox value="黑旋風" onChange={vi.fn()} onSubmit={onSubmit} />);
    const input = screen.getByRole('searchbox');
    input.focus();
    await userEvent.keyboard('a');
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('GroupToggle', () => {
  it('GT-1 BASE 天罡 button, aria-pressed=false, leading group dot', () => {
    const { container } = render(<GroupToggle group="天罡" pressed={false} onToggle={vi.fn()} />);
    const btn = screen.getByRole('button', { name: '天罡' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn.textContent).toBe('天罡');
    const dot = container.querySelector('.dot');
    expect(dot).not.toBeNull();
    expect(btn.firstElementChild).toBe(dot);
  });

  it('GT-2 pressed=true reflects all-selected; click calls onToggle', async () => {
    const onToggle = vi.fn();
    render(<GroupToggle group="天罡" pressed onToggle={onToggle} />);
    const btn = screen.getByRole('button', { name: '天罡' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('GT-3 地煞 label', () => {
    render(<GroupToggle group="地煞" pressed={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: '地煞' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('CharacterChip', () => {
  const pickOf = (container: HTMLElement) => container.querySelector<HTMLButtonElement>('.chip > button.pick')!;

  it('CC-1 BASE pick button shows avatar char, name, first nickname; aria-pressed=false; no info button', () => {
    const { container } = render(<CharacterChip character={linchong} selected={false} onToggle={vi.fn()} />);
    const chip = container.querySelector('.chip')!;
    expect(chip).not.toHaveClass('on');
    const pick = pickOf(container);
    expect(pick).toHaveAttribute('aria-pressed', 'false');
    expect(pick.querySelector('.av')).toHaveTextContent('林');
    expect(pick.querySelector('.nm')!.textContent).toBe('林沖');
    expect(pick.querySelector('.nk')!.textContent).toBe('豹子頭');
    // 顯示順序：頭像字 → 姓名 → 主綽號
    expect(pick.textContent).toBe('林林沖豹子頭');
    expect(screen.queryByRole('button', { name: '林沖 角色資料' })).toBeNull();
  });

  it('CC-2 selected chip: aria-pressed=true and .on; click calls onToggle(id)', async () => {
    const onToggle = vi.fn();
    const { container } = render(<CharacterChip character={linchong} selected onToggle={onToggle} />);
    expect(container.querySelector('.chip')).toHaveClass('on');
    const pick = pickOf(container);
    expect(pick).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(pick);
    expect(onToggle).toHaveBeenCalledWith('linchong');
  });

  it('CC-3 character without nickname (高俅) shows only the name', () => {
    const { container } = render(<CharacterChip character={gaoqiu} selected={false} onToggle={vi.fn()} />);
    const pick = pickOf(container);
    expect(pick.querySelector('.nk')).toBeNull();
    expect(pick.querySelector('.nm')!.textContent).toBe('高俅');
  });

  it('CC-4 with onInfo renders the i button (aria-label, title) after pick', () => {
    const { container } = render(
      <CharacterChip character={linchong} selected={false} onToggle={vi.fn()} onInfo={vi.fn()} />,
    );
    const info = screen.getByRole('button', { name: '林沖 角色資料' });
    expect(info).toHaveAttribute('title', '角色資料');
    expect(info.textContent).toBe('i');
    expect(info).toHaveClass('info');
    expect(pickOf(container).nextElementSibling).toBe(info);
  });

  it('CC-5 clicking i calls onInfo(id) and not onToggle (AC-S12)', async () => {
    const onToggle = vi.fn();
    const onInfo = vi.fn();
    render(<CharacterChip character={linchong} selected={false} onToggle={onToggle} onInfo={onInfo} />);
    await userEvent.click(screen.getByRole('button', { name: '林沖 角色資料' }));
    expect(onInfo).toHaveBeenCalledWith('linchong');
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe('CharacterList', () => {
  it('CL-1 BASE renders one chip per character in the given order with selection state', () => {
    const { container } = render(
      <CharacterList
        characters={realDataset.characters}
        selectedIds={new Set(['wusong'])}
        onToggle={vi.fn()}
      />,
    );
    const names = [...container.querySelectorAll('.chip .nm')].map((el) => el.textContent);
    expect(names).toEqual(realDataset.characters.map((c) => c.name));
    const pressed = [...container.querySelectorAll('.chip > button.pick[aria-pressed="true"]')];
    expect(pressed).toHaveLength(1);
    expect(pressed[0]!.querySelector('.nm')!.textContent).toBe('武松');
    expect(screen.queryByText('找不到符合的角色')).toBeNull();
  });

  it('CL-2 no characters → 「找不到符合的角色」 replaces the list', () => {
    const { container } = render(<CharacterList characters={[]} selectedIds={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByText('找不到符合的角色')).toBeInTheDocument();
    expect(container.querySelectorAll('.chip')).toHaveLength(0);
  });

  it('CL-3 passes onInfo to every chip', async () => {
    const onInfo = vi.fn();
    render(
      <CharacterList characters={[linchong, gaoqiu]} selectedIds={new Set()} onToggle={vi.fn()} onInfo={onInfo} />,
    );
    await userEvent.click(screen.getByRole('button', { name: '高俅 角色資料' }));
    expect(onInfo).toHaveBeenCalledWith('gaoqiu');
  });
});

// SelectedTags 由 T071 實作（與本檔不同波次）。以執行期動態 import 載入：T071 完成前只有本 describe 紅燈，
// 不讓整檔 import 失敗、也不讓 typecheck 因檔案不存在而失敗；props 介面以下列型別為契約。
type SelectedTagsProps = {
  characters: readonly Character[];
  onRemove: (id: string) => void;
  onClear: () => void;
};
type SelectedTagsComponent = (props: SelectedTagsProps) => ReactElement | null;
const SELECTED_TAGS_MODULE = './SelectedTags';

describe('SelectedTags', () => {
  const load = async () =>
    ((await import(/* @vite-ignore */ SELECTED_TAGS_MODULE)) as { SelectedTags: SelectedTagsComponent }).SelectedTags;

  it('ST-1 nothing selected → 「未選角色，顯示全部角色的事件」 only', async () => {
    const SelectedTags = await load();
    render(<SelectedTags characters={[]} onRemove={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByText('未選角色，顯示全部角色的事件')).toBeInTheDocument();
    expect(screen.queryByText('已選')).toBeNull();
    expect(screen.queryByRole('button', { name: '清除全部' })).toBeNull();
  });

  it('ST-2 selected → 「已選」 + 「<姓名> ×」 tags in insertion order + 「清除全部」', async () => {
    const SelectedTags = await load();
    const songjiang = byName('宋江');
    const likui = byName('李逵');
    const { container } = render(
      <SelectedTags characters={[likui, songjiang]} onRemove={vi.fn()} onClear={vi.fn()} />,
    );
    expect(screen.getByText('已選')).toBeInTheDocument();
    expect(screen.queryByText('未選角色，顯示全部角色的事件')).toBeNull();
    const removeButtons = screen.getAllByRole('button', { name: /^移除 / });
    expect(removeButtons.map((b) => b.getAttribute('aria-label'))).toEqual(['移除 李逵', '移除 宋江']);
    expect(removeButtons.every((b) => b.textContent === '×')).toBe(true);
    const tags = [...container.querySelectorAll('.tag')].map((t) => (t.textContent ?? '').replace(/\s+/g, ''));
    expect(tags).toEqual(['李逵×', '宋江×']);
    const clearAll = screen.getByRole('button', { name: '清除全部' });
    // 清除全部在最後一個標籤之後
    expect(removeButtons[1]!.compareDocumentPosition(clearAll) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('ST-3 × calls onRemove(id); 清除全部 calls onClear', async () => {
    const SelectedTags = await load();
    const onRemove = vi.fn();
    const onClear = vi.fn();
    const songjiang = byName('宋江');
    render(<SelectedTags characters={[songjiang, byName('李逵')]} onRemove={onRemove} onClear={onClear} />);
    await userEvent.click(within(document.body).getByRole('button', { name: '移除 宋江' }));
    expect(onRemove).toHaveBeenCalledWith('songjiang');
    await userEvent.click(screen.getByRole('button', { name: '清除全部' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
