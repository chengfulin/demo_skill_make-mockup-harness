/**
 * S1 大節選單（Prototype `#arcSel`；contracts/ui-contracts.md「S1」；FR-011）。
 * `<select aria-label="大節">`：第一項「全部大節（第 1–120 回）」值為空，其餘依資料順序
 * 「<大節名>（第 <a>–<b> 回）」（`formatArcOption`）、值為大節 id。選「全部大節」回傳 null。
 */
import type { ChangeEvent } from 'react';
import { formatArcOption } from '../../domain/format';
import type { Arc } from '../../domain/types';

/** 「全部大節」選項文字（全書第 1–120 回） */
const ALL_ARCS_LABEL = '全部大節（第 1–120 回）';

export interface ArcSelectProps {
  /** 依 arcs.json 順序 */
  arcs: readonly Arc[];
  /** 目前大節 id；null＝全部大節 */
  value: string | null;
  onChange: (id: string | null) => void;
}

export function ArcSelect({ arcs, value, onChange }: ArcSelectProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value === '' ? null : e.target.value);
  return (
    <select className="arc-select" aria-label="大節" value={value ?? ''} onChange={handleChange}>
      <option value="">{ALL_ARCS_LABEL}</option>
      {arcs.map((arc) => (
        <option key={arc.id} value={arc.id}>
          {formatArcOption(arc)}
        </option>
      ))}
    </select>
  );
}
