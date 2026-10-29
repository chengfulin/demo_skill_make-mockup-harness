/**
 * S1 已選列內容（Prototype `renderSel`；contracts/ui-contracts.md「S1」已選列）：填入 FilterBar 的 `sel` 插槽。
 * 未選：`span.label`「未選角色，顯示全部角色的事件」；
 * 有選：`span.label`「已選」→ 每位 `.tag`（姓名＋`button[aria-label="移除 <姓名>"]`「×」，依加入順序）→ `button.link`「清除全部」。
 */
import type { Character } from '../../domain/types';

export interface SelectedTagsProps {
  /** 已選角色，依加入順序 */
  characters: readonly Character[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function SelectedTags({ characters, onRemove, onClear }: SelectedTagsProps) {
  if (characters.length === 0) {
    return <span className="label">未選角色，顯示全部角色的事件</span>;
  }
  return (
    <>
      <span className="label">已選</span>
      {characters.map((c) => (
        <span className="tag" key={c.id}>
          {c.name}
          <button type="button" aria-label={`移除 ${c.name}`} onClick={() => onRemove(c.id)}>
            ×
          </button>
        </span>
      ))}
      <button type="button" className="link" onClick={onClear}>
        清除全部
      </button>
    </>
  );
}
