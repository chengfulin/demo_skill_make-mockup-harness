/**
 * S4 人物關係區塊（contracts/ui-contracts.md「S4」內容 ⑥；Prototype `.sec` ＞ h4「人物關係」＋ `.rlist`）：
 * 每鈕「<頭像> <姓名> <關係類型>」，`title`＝關係說明；點擊 → onOpenCharacter（切換為對方資料，AC-13、AC-P24）。
 * 關係類型標籤色取 token `--r-*`（Prototype 對照；師徒資料未出現，比照 Prototype 退回 --r-jie）。
 * 無關係顯示「收錄範圍內沒有此角色的關係資料。」。只吃 props（§FE-4）。
 */
import type { Character, RelationType } from '../../domain/types';
import { Avatar } from '../Avatar/Avatar';

/** 對方角色＋關係（容器自 `dataset.relations` 取含本角色者、換成另一端）。 */
export interface RelatedCharacter {
  character: Character;
  type: RelationType;
  note: string;
}

const TYPE_TOKEN: Record<RelationType, string> = {
  結義: 'jie',
  師徒: 'jie',
  主僕: 'zhu',
  兄弟: 'xd',
  夫妻: 'fq',
  仇敵: 'ch',
};

export interface CharacterRelationsProps {
  /** 關係（依資料順序） */
  relations: readonly RelatedCharacter[];
  /** 點關係對象：開其角色資料 */
  onOpenCharacter?: (characterId: string) => void;
}

export function CharacterRelations({ relations, onOpenCharacter }: CharacterRelationsProps) {
  return (
    <div className="sec">
      <h4>人物關係</h4>
      {relations.length > 0 ? (
        <div className="rlist">
          {relations.map(({ character: o, type, note }) => (
            <button
              type="button"
              key={`${o.id}-${type}`}
              title={note}
              onClick={() => onOpenCharacter?.(o.id)}
            >
              <Avatar avatar={o.avatar} group={o.group} size="sm" />
              {o.name}
              <span className="rt" style={{ color: `var(--r-${TYPE_TOKEN[type]})` }}>
                {type}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="hint">收錄範圍內沒有此角色的關係資料。</p>
      )}
    </div>
  );
}
