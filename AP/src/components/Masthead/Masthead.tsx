/**
 * 頁首（ui-contracts「頁首」、FR-024；Prototype `header.wrap.mast`）。
 * 印章（aria-hidden）→ h1 站名 → 副標；人物數與事件數由 props 帶入（不寫死），
 * `counts` 為 null（資料未就緒）時不渲染副標。
 */
import './Masthead.css';

export interface MastheadCounts {
  /** 收錄人物數 */
  characters: number;
  /** 收錄事件數 */
  events: number;
}

export interface MastheadProps {
  counts: MastheadCounts | null;
}

const SEAL_CHARS = ['水', '滸', '年', '表'] as const;

export function Masthead({ counts }: MastheadProps) {
  return (
    <header className="wrap mast">
      <div className="seal" aria-hidden="true">
        {SEAL_CHARS.map((ch) => (
          <span key={ch}>{ch}</span>
        ))}
      </div>
      <div>
        <h1>水滸時間軸</h1>
        {counts ? (
          <p>{`依百二十回本《水滸全傳》章回 · 收錄 ${counts.characters} 位人物、${counts.events} 件事`}</p>
        ) : null}
      </div>
    </header>
  );
}
