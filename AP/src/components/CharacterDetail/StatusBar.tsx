/**
 * S4 狀態區塊（contracts/ui-contracts.md「S4」內容 ②；FR-013；Prototype `.stwrap`／`.stbar`／`.stscale`／`.legend`）：
 * 小標「一百二十回中的狀態」→ 節點標記（「登場 <n>」「上梁山 <n>」「結局 <n>」＋豎線）→ 四色區段狀態條
 * （`role="img"`、`aria-label` 由 `statusAriaLabel` 產生，E2E 以此驗 AC-P22／AC-P23／AC-S16）→ 刻度 1、30、60、90、120 → 圖例。
 * 吃 `statusSegments` 與 `milestones` 的結果（只吃 props，§FE-4）；色取 token `--st-*`（StatusBar.css）。
 *
 * 標記位置沿用 Prototype：左緣 = (n − 0.5) / 120；與前一標記相距 < 16 回且為第 2 個標記時上移一列避免重疊；
 * n > 108 靠右對齊、n < 8 靠左對齊，其餘置中。
 */
import { Fragment, type CSSProperties } from 'react';
import { CHAPTER_COUNT, statusAriaLabel, type Milestone, type StatusSegment } from '../../domain/status';
import type { CharacterStatus } from '../../domain/types';
import './StatusBar.css';

const STATUS_CLASS: Record<CharacterStatus, string> = {
  未登場: 's-none',
  在野: 's-wild',
  已上梁山: 's-liang',
  已死亡或離散: 's-gone',
};

const LEGEND: readonly CharacterStatus[] = ['未登場', '在野', '已上梁山', '已死亡或離散'];
const SCALE: readonly number[] = [1, 30, 60, 90, 120];

/** 第 n 回在狀態條上的左緣百分比（指向該回的中點）。 */
function pos(n: number): string {
  return `${(((n + 0.5 - 1) / CHAPTER_COUNT) * 100).toFixed(2)}%`;
}

export interface StatusBarProps {
  /** `statusSegments(c)` */
  segments: readonly StatusSegment[];
  /** `milestones(c)` */
  milestones: readonly Milestone[];
}

export function StatusBar({ segments, milestones }: StatusBarProps) {
  return (
    <div className="sec status-sec">
      <h4>一百二十回中的狀態</h4>
      <div className="stwrap">
        {milestones.map((m, i) => {
          const prev = milestones[i - 1];
          const up = prev !== undefined && Math.abs(m.chapter - prev.chapter) < 16 && i % 2 === 1;
          const left = pos(m.chapter);
          const markStyle: CSSProperties = { left, top: up ? 0 : 15 };
          if (m.chapter > 108) markStyle.translate = '-100% 0';
          else if (m.chapter < 8) markStyle.translate = '0 0';
          const lineStyle: CSSProperties = up ? { left, top: 14, height: 44 } : { left };
          return (
            <Fragment key={m.label}>
              <span className="stmk" style={markStyle}>
                {m.label} {m.chapter}
              </span>
              <span className="stln" style={lineStyle} aria-hidden="true" />
            </Fragment>
          );
        })}
        <div className="stbar" role="img" aria-label={statusAriaLabel(segments)}>
          {segments.map((s) => (
            <i
              key={s.from}
              className={STATUS_CLASS[s.status]}
              style={{ width: `${(s.count / CHAPTER_COUNT) * 100}%` }}
            />
          ))}
        </div>
        <div className="stscale">
          {SCALE.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>
      <div className="legend">
        {LEGEND.map((s) => (
          <span key={s}>
            <i className={STATUS_CLASS[s]} />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
