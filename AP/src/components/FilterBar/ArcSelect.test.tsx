/**
 * ArcSelect（S1 大節選單）元件測試（T077，US3）
 *
 * 依據：contracts/ui-contracts.md「S1」元件對照（大節 → `ArcSelect`，`<select aria-label="大節">`，`selectArc`）、
 *       逐字文案（第一項「全部大節（第 1–120 回）」值為空；其他項「<大節名>（第 <a>–<b> 回）」，
 *       例「魂聚蓼兒洼（第 120–120 回）」）；spec FR-011（單選＋全部大節）、AC-S14；
 *       Prototype `#arcSel`（index.html：`<option value="">全部大節…` ＋ 每大節 `<option value="<id>">`）。
 *
 * 本測試同時定義 T080 要實作的 props 介面（展示元件只吃 props，plan「元件分層」）：
 *   - `ArcSelect`（./ArcSelect）：
 *       { arcs: readonly Arc[];              // 依 arcs.json 順序
 *         value: string | null;              // 目前大節 id；null＝全部大節
 *         onChange: (id: string | null) => void }  // 選「全部大節」回傳 null
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：真實 12 個大節、value=null、不操作
 *
 * | 特徵                 | blocks                                         | base     | 對應案例         |
 * | :------------------- | :--------------------------------------------- | :------- | :--------------- |
 * | S1 選項清單          | 真實 12 大節（全部大節＋12 項，依資料順序）    | 12 大節  | AS-1、AS-2       |
 * | S2 目前值 value      | null（全部大節）／某大節 id                    | null     | AS-1、AS-3       |
 * | S3 使用者操作        | 不操作／選某大節／選「全部大節」               | 不操作   | AS-1、AS-4、AS-5 |
 *
 * 範圍外（主要流程外，一次性宣告）：value 為不存在的 id（由 reducer 只收選項值，不會發生）；
 * 空大節清單（資料驗證保證 12 項）；選項文字的格式細節由 domain/format.test.ts 驗（formatArcOption）。
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { realDataset } from '../../test-utils/realDataset';
import { ArcSelect } from './ArcSelect';

const arcs = realDataset.arcs;

function renderArcSelect(value: string | null = null) {
  const onChange = vi.fn();
  render(<ArcSelect arcs={arcs} value={value} onChange={onChange} />);
  const select = screen.getByRole<HTMLSelectElement>('combobox', { name: '大節' });
  return { select, onChange };
}

describe('ArcSelect（S1 大節選單）', () => {
  // AS-1（base）：<select aria-label="大節">，第一項「全部大節（第 1–120 回）」值為空，目前值為空
  it('renders a select labelled 大節 with 全部大節 first (empty value) and selected by default', () => {
    const { select } = renderArcSelect();
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveAttribute('aria-label', '大節');
    const first = select.options[0];
    expect(first?.textContent).toBe('全部大節（第 1–120 回）');
    expect(first?.value).toBe('');
    expect(select.value).toBe('');
  });

  // AS-2：其餘 12 項依資料順序，文字「<大節名>（第 <a>–<b> 回）」、值為大節 id
  it('lists the 12 arcs in data order as "<name>（第 a–b 回）" with arc ids as values', () => {
    const { select } = renderArcSelect();
    const rest = [...select.options].slice(1);
    expect(rest).toHaveLength(12);
    expect(rest.map((o) => o.value)).toEqual(arcs.map((a) => a.id));
    expect(rest.map((o) => o.textContent)).toEqual(
      arcs.map((a) => `${a.name}（第 ${a.chapters[0]}–${a.chapters[1]} 回）`),
    );
    expect(rest[4]?.textContent).toBe('三打祝家莊（第 43–50 回）');
    expect(rest[11]?.textContent).toBe('魂聚蓼兒洼（第 120–120 回）');
  });

  // AS-3：value 為某大節 id 時選單顯示該大節（AC-P17：點色帶後選單值同步）
  it('reflects the current arc id as the selected option', () => {
    const { select } = renderArcSelect('arc-03');
    expect(select.value).toBe('arc-03');
    expect(select.selectedOptions[0]?.textContent).toBe('武松（第 23–31 回）');
  });

  // AS-4：選某大節 → onChange(該 id)
  it('calls onChange with the arc id when an arc is chosen', async () => {
    const { select, onChange } = renderArcSelect();
    await userEvent.selectOptions(select, '三打祝家莊（第 43–50 回）');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('arc-05');
  });

  // AS-5：選「全部大節」→ onChange(null)（AC-S14）
  it('calls onChange with null when 全部大節 is chosen', async () => {
    const { select, onChange } = renderArcSelect('arc-05');
    await userEvent.selectOptions(select, '全部大節（第 1–120 回）');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
