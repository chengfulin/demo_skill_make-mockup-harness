/**
 * 關係圖節點（S6；Prototype `g.node[data-node]`）。
 * 群組以 CSS transform 定位（`transform .5s, opacity .3s` 過場，GraphView.css）；
 * 圓 `circle.c.<tg|ds|ot>`（`role="button"`、`tabindex="0"`、`aria-label`「<姓名> 角色資料」，點擊或 Enter／Space 開角色資料，AC-P32）
 * ＋ 頭像字 `text.ch` ＋ 姓名 `text.nm` ＋「＋」`g.plus`（`aria-label`「將 <姓名> 加入篩選」，已選節點不渲染，AC-P31）。
 * 已選：`.sel`（朱色外框）＋ `data-selected="true"`；淡出：`.dim` ＋ `data-dim="true"`。
 */
import type { KeyboardEvent, MouseEvent } from 'react';
import { NODE_R, PLUS_R, type GraphNodeLayout } from '../../domain/graphLayout';
import type { CharacterGroup } from '../../domain/types';

export interface GraphNodeProps {
  node: GraphNodeLayout;
  onOpen: (id: string) => void;
  onAdd: (id: string) => void;
}

const GROUP_CLASS: Record<CharacterGroup, string> = { 天罡: 'tg', 地煞: 'ds', 其他: 'ot' };

/** 「＋」圓心相對節點中心的位移（Prototype translate(19,-19)） */
const PLUS_OFFSET = 19;
/** 姓名基線相對節點中心的位移 */
const NAME_Y = 38;

function activateOn(handler: () => void) {
  return (e: KeyboardEvent<SVGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handler();
    }
  };
}

export function GraphNode({ node, onOpen, onAdd }: GraphNodeProps) {
  const { id, name, avatar, group, x, y, selected, dim } = node;
  const className = ['node', selected ? 'sel' : null, dim ? 'dim' : null].filter(Boolean).join(' ');
  const open = () => onOpen(id);
  const add = () => onAdd(id);
  return (
    <g
      className={className}
      data-node={id}
      data-selected={selected ? 'true' : undefined}
      data-dim={dim ? 'true' : undefined}
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <circle
        className={`c ${GROUP_CLASS[group]}`}
        r={NODE_R}
        role="button"
        tabIndex={0}
        aria-label={`${name} 角色資料`}
        onClick={open}
        onKeyDown={activateOn(open)}
      >
        <title>{name}</title>
      </circle>
      <text className="ch">{avatar}</text>
      <text className="nm" y={NAME_Y}>
        {name}
      </text>
      {!selected && (
        <g
          className="plus"
          transform={`translate(${PLUS_OFFSET},${-PLUS_OFFSET})`}
          role="button"
          tabIndex={0}
          aria-label={`將 ${name} 加入篩選`}
          onClick={(e: MouseEvent<SVGGElement>) => {
            e.stopPropagation();
            add();
          }}
          onKeyDown={activateOn(add)}
        >
          <circle r={PLUS_R} />
          <text>＋</text>
        </g>
      )}
    </g>
  );
}
