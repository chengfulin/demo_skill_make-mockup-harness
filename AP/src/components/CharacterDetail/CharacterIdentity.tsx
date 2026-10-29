/**
 * S4 身分區（contracts/ui-contracts.md「S4」內容 ①；Prototype 大頭像＋`h2`＋`.meta`）：
 * 大頭像（xl）→ 姓名 `h2` → 中繼列「綽號 <nickname 原字串>」（無綽號不顯示）與
 * 「<星號>・第 <座次> 位・<天罡｜地煞>」或「非一百單八將」（AC-12、AC-P22）。
 * 只吃 props（§FE-4）。
 */
import type { Character } from '../../domain/types';
import { Avatar } from '../Avatar/Avatar';

export interface CharacterIdentityProps {
  character: Character;
}

export function CharacterIdentity({ character: c }: CharacterIdentityProps) {
  return (
    <div className="cd-head">
      <Avatar avatar={c.avatar} group={c.group} size="xl" />
      <div>
        <h2>{c.name}</h2>
        <div className="meta">
          {c.nickname ? (
            <span>
              綽號 <b>{c.nickname}</b>
            </span>
          ) : null}
          <span>
            {c.star !== null && c.rank !== null ? (
              <>
                <b>{c.star}</b>・第 {c.rank} 位・{c.group}
              </>
            ) : (
              <b>非一百單八將</b>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
