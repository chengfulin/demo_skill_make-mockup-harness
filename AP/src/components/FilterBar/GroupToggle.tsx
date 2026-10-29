/**
 * S1 天罡／地煞快選鈕（Prototype `button.tog` > `span.dot`；FR-010、G-7）。
 * `aria-pressed`＝該群組已全選（全選時底色反白，樣式見 FilterBar.css）；選取規則由容器／reducer 處理。
 */
import type { CSSProperties } from 'react';

export type ToggleGroup = '天罡' | '地煞';

export interface GroupToggleProps {
  group: ToggleGroup;
  /** 該群組成員已全選 */
  pressed: boolean;
  onToggle: () => void;
}

/** 群組色圓點（同 Avatar 的群組 token） */
const DOT_COLOR: Record<ToggleGroup, string> = { 天罡: 'var(--g-tg)', 地煞: 'var(--g-ds)' };

export function GroupToggle({ group, pressed, onToggle }: GroupToggleProps) {
  const dotStyle: CSSProperties = { background: DOT_COLOR[group] };
  return (
    <button type="button" className="tog" aria-pressed={pressed} onClick={onToggle}>
      <span className="dot" style={dotStyle} aria-hidden="true" />
      {group}
    </button>
  );
}
