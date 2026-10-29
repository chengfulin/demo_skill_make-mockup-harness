/**
 * 頭像（Prototype `av(c, cls)`）：頭像字＋群組色＋選用朱色外框。
 * `aria-hidden`：可存取名稱由外層（chip、按鈕、節點）提供。
 */
import type { CharacterGroup } from '../../domain/types';
import './Avatar.css';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  /** 頭像字（`Character.avatar`） */
  avatar: string;
  /** 星號群組，決定底色 token */
  group: CharacterGroup;
  /** 已選：加朱色外框 */
  highlighted?: boolean;
  /** 尺寸（--size-avatar-*）；預設 md */
  size?: AvatarSize;
}

const GROUP_CLASS: Record<CharacterGroup, string> = { 天罡: 'tg', 地煞: 'ds', 其他: 'ot' };

export function Avatar({ avatar, group, highlighted = false, size = 'md' }: AvatarProps) {
  const className = ['av', GROUP_CLASS[group], `av-${size}`, highlighted ? 'ring' : null]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={className} aria-hidden="true">
      {avatar}
    </span>
  );
}
