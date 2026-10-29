/**
 * 面板共用殼（ui-contracts「S3」「S4」區塊順序；Prototype `#scrim` ＋ `aside.drawer`）。
 * 結構：遮罩 `.scrim` → `aside.drawer` > 頁首 `.dh`（類別字 `.k` → 關閉鈕 `.x`「×」）→ 內容 `.db` →（選用）底部 `.pn`。
 * 關閉：關閉鈕、點遮罩、按 Escape 皆觸發 `onClose`（G-10、AC-S24）。
 * 版面：寬 min(440px, 100%)，≤720px 全寬、高 82% 底部抽屜（Drawer.css；FR-012、FR-014）。
 * 只吃 props（§FE-4）：開關與內容由容器決定，本元件掛載即代表面板開啟。
 */
import { useEffect, useRef, type ReactNode } from 'react';
import './Drawer.css';

export interface DrawerProps {
  /** 畫面根的 `data-page`（如「S3 事件明細面板」） */
  page: string;
  /** `aria-label`（如「事件明細」） */
  label: string;
  /** `data-testid`（如 `event-drawer`） */
  testId: string;
  /** 頁首類別字（如「事件 · 誤走妖魔・魯智深與林沖」、「角色資料」） */
  kicker: string;
  /** 關閉（關閉鈕、遮罩、Escape） */
  onClose: () => void;
  /** 內容區 `.db` */
  children: ReactNode;
  /** 底部列 `.pn`（S3 上一個／下一個）；未給則不渲染 */
  footer?: ReactNode;
}

export function Drawer({ page, label, testId, kicker, onClose, children, footer }: DrawerProps) {
  // 以 ref 保存最新 onClose，Escape 監聽只在掛載時註冊一次。
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" data-page={page} aria-label={label} data-testid={testId}>
        <div className="dh">
          <span className="k">{kicker}</span>
          <button type="button" className="x" aria-label="關閉" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="db">{children}</div>
        {footer != null ? <div className="pn">{footer}</div> : null}
      </aside>
    </>
  );
}
