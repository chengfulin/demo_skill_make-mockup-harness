/**
 * 關係圖圖例（S6；Prototype `.glegend`）。
 * 依序：天罡、地煞、其他（群組色點）→ 資料中出現的關係類型（線樣式示意，AC-P40 不含師徒）→ 說明文字（D-4，最後一項）。
 */
import type { RelationType } from '../../domain/types';
import { RELATION_CLASS } from './GraphEdge';

export interface GraphLegendProps {
  types: readonly RelationType[];
  caption: string;
}

const GROUPS = [
  { label: '天罡', cls: 'tg' },
  { label: '地煞', cls: 'ds' },
  { label: '其他', cls: 'ot' },
] as const;

export function GraphLegend({ types, caption }: GraphLegendProps) {
  return (
    <div className="glegend">
      {GROUPS.map((g) => (
        <span key={g.cls}>
          <span className={`gdot ${g.cls}`} aria-hidden="true" />
          {g.label}
        </span>
      ))}
      {types.map((t) => (
        <span key={t}>
          <svg viewBox="0 0 30 10" aria-hidden="true">
            <line className={`e-${RELATION_CLASS[t]}`} x1="0" y1="5" x2="30" y2="5" />
          </svg>
          {t}
        </span>
      ))}
      <span className="gcaption">{caption}</span>
    </div>
  );
}
