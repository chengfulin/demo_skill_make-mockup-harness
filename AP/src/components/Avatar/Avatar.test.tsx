/**
 * 頭像 Avatar（T033；Prototype `.av`／`.av.tg|ds|ot`／`.av.ring`；research「設計 token」--g-tg／--g-ds／--g-ot／--seal、--size-avatar-*）
 *
 * 介面：{ avatar: string; group: CharacterGroup; highlighted?: boolean; size?: 'sm'|'md'|'lg'|'xl' }
 *   渲染 `<span class="av <tg|ds|ot> av-<size> [ring]" aria-hidden="true">頭像字</span>`；
 *   group 決定色 class（天罡 tg、地煞 ds、其他 ot）；highlighted 加 `ring`（朱色外框）；size 預設 md。
 *   文字由外層提供（aria-hidden），本元件不帶可存取名稱。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：avatar='林'、group='天罡'、highlighted 未給、size 未給
 *
 * | 特徵            | blocks（非 base 者各為一案）           | 對應案例     |
 * | :-------------- | :------------------------------------- | :----------- |
 * | G1 群組         | 天罡（base）／地煞／其他               | AV-G1～AV-G2 |
 * | H1 高亮         | 未給（base）／true／false              | AV-H1～AV-H2 |
 * | S1 尺寸         | 未給＝md（base）／sm／lg／xl           | AV-S1        |
 *
 * 範圍外（一次性宣告）：實際色值與像素（由 CSS token 決定，Prototype 並列比對 E2E 驗）；
 * 空字串頭像字（資料由 validateDataset 與轉換腳本保證非空）。
 */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

const span = (ui: React.ReactElement) => render(ui).container.firstElementChild as HTMLElement;

describe('Avatar', () => {
  it('BASE renders the avatar char, aria-hidden, tg group, md size, no ring', () => {
    const el = span(<Avatar avatar="林" group="天罡" />);
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveTextContent('林');
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).toHaveClass('av', 'tg', 'av-md');
    expect(el).not.toHaveClass('ring');
  });

  it('AV-G1 地煞 uses ds', () => {
    const el = span(<Avatar avatar="二" group="地煞" />);
    expect(el).toHaveClass('ds');
    expect(el).not.toHaveClass('tg');
  });

  it('AV-G2 其他 uses ot', () => {
    expect(span(<Avatar avatar="高" group="其他" />)).toHaveClass('ot');
  });

  it('AV-H1 highlighted adds ring (seal outline)', () => {
    expect(span(<Avatar avatar="林" group="天罡" highlighted />)).toHaveClass('ring');
  });

  it('AV-H2 highlighted=false has no ring', () => {
    expect(span(<Avatar avatar="林" group="天罡" highlighted={false} />)).not.toHaveClass('ring');
  });

  it.each(['sm', 'lg', 'xl'] as const)('AV-S1 size %s', (size) => {
    const el = span(<Avatar avatar="林" group="天罡" size={size} />);
    expect(el).toHaveClass(`av-${size}`);
    expect(el).not.toHaveClass('av-md');
  });
});
