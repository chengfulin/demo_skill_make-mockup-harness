/**
 * S3 回目區塊（Prototype `.sec` ＞ h4「回目」＋ `ul.huimu`）：依章回區間逐回列出「<第八回> <回目>」（AC-P18）。
 */
import type { Chapter } from '../../domain/types';

export interface EventChaptersProps {
  /** 事件章回區間內的各回（依回次順序；由容器自 `chapterByNo` 取出） */
  chapters: readonly Chapter[];
}

export function EventChapters({ chapters }: EventChaptersProps) {
  return (
    <div className="sec">
      <h4>回目</h4>
      <ul className="huimu">
        {chapters.map((c) => (
          <li key={c.no}>
            <span>{c.label}</span>
            {c.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
