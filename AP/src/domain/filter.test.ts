/**
 * 篩選純函式 filterEvents／charactersInArc（T021；data-model.md §5、§7；FR-003、G-9）
 *
 * filterEvents(events, selected, arcId)：
 *   「(arcId 為空 或 e.arc = arcId) 且 (selected 為空 或 e.characters ∩ selected ≠ ∅)」，保留輸入順序。
 * charactersInArc(events, arcId)：在該大節至少參與一個事件的角色 id 集合。
 * Oracle：真實資料（realDataset）上的 AC 數字。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：selected 空、arcId null → 54（全部事件，全書順序）
 *
 * | 特徵                       | blocks（非 base 者各為一案）                                   | 對應案例       |
 * | :------------------------- | :------------------------------------------------------------- | :------------- |
 * | F1 已選角色數              | 0（base）／1（武松 8、林沖 10）／2（武松＋魯智深 14、林沖＋宋江 31）／多（天罡 17 位 52） | FLT-1～FLT-5 |
 * | F2 大節                    | null（base）／指定（三打祝家莊 4）                             | FLT-6          |
 * | F3 角色 × 大節組合         | 有交集（征方臘＋武松 2）／無交集（誤走妖魔・魯智深與林沖＋王英 0） | FLT-7～FLT-8 |
 * | F4 輸出順序                | 與輸入（全書順序）一致                                          | FLT-ORD        |
 * | A1 大節參與角色            | 有多位（含／不含指定角色）／只有一位（武松大節）               | CIA-1～CIA-3   |
 *
 * 範圍外（一次性宣告）：selected 含不存在的 id（id 由 chip 列產生，必存在）；arcId 不存在（同理）。
 */
import { describe, expect, it } from 'vitest';
import { arcIdOf, idOf, realDataset } from '../test-utils/realDataset';
import { charactersInArc, filterEvents } from './filter';

const { events } = realDataset;
const ids = (names: string[]) => names.map(idOf);
const titles = (list: readonly { title: string }[]) => list.map((e) => e.title);

describe('filterEvents', () => {
  it('BASE no filter returns all 54 events', () => {
    expect(filterEvents(events, [], null)).toHaveLength(54);
  });

  it('FLT-1 Wu Song only: 8', () => {
    expect(filterEvents(events, ids(['武松']), null)).toHaveLength(8);
  });

  it('FLT-2 Lin Chong only: 10', () => {
    expect(filterEvents(events, ids(['林沖']), null)).toHaveLength(10);
  });

  it('FLT-3 Wu Song + Lu Zhishen (union): 14', () => {
    expect(filterEvents(events, ids(['武松', '魯智深']), null)).toHaveLength(14);
  });

  it('FLT-4 Lin Chong + Song Jiang: 31', () => {
    expect(filterEvents(events, ids(['林沖', '宋江']), null)).toHaveLength(31);
  });

  it('FLT-5 all 17 Tiangang characters: 52', () => {
    const tiangang = realDataset.characters.filter((c) => c.group === '天罡').map((c) => c.id);
    expect(tiangang).toHaveLength(17);
    expect(tiangang).not.toContain(idOf('晁蓋'));
    expect(filterEvents(events, tiangang, null)).toHaveLength(52);
  });

  it('FLT-6 arc 三打祝家莊 only: 4', () => {
    const result = filterEvents(events, [], arcIdOf('三打祝家莊'));
    expect(result).toHaveLength(4);
    expect(result.every((e) => e.arc === arcIdOf('三打祝家莊'))).toBe(true);
  });

  it('FLT-7 arc 征方臘 + Wu Song: 睦州血戰 and 魯智深擒方臘・浙江坐化', () => {
    const result = filterEvents(events, ids(['武松']), arcIdOf('征方臘'));
    expect(titles(result)).toEqual(['睦州血戰', '魯智深擒方臘・浙江坐化']);
  });

  it('FLT-8 arc 誤走妖魔・魯智深與林沖 + Wang Ying: 0', () => {
    expect(filterEvents(events, ids(['王英']), arcIdOf('誤走妖魔・魯智深與林沖'))).toEqual([]);
  });

  it('FLT-ORD keeps input (book) order', () => {
    const result = filterEvents(events, ids(['武松', '魯智深']), null);
    const order = result.map((e) => events.indexOf(e));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe('charactersInArc', () => {
  it('CIA-1 returns every character who joins at least one event in the arc', () => {
    const arcId = arcIdOf('三打祝家莊');
    const expected = new Set(
      events.filter((e) => e.arc === arcId).flatMap((e) => e.characters),
    );
    const result = charactersInArc(events, arcId);
    expect(new Set(result)).toEqual(expected);
    expect(new Set(result).has(idOf('林沖'))).toBe(true);
  });

  it('CIA-2 excludes characters without events in the arc', () => {
    const result = new Set(charactersInArc(events, arcIdOf('誤走妖魔・魯智深與林沖')));
    expect(result).toEqual(new Set(ids(['高俅', '魯智深', '林沖', '柴進', '楊志'])));
    expect(result.has(idOf('王英'))).toBe(false);
  });

  it('CIA-3 arc with a single participant (武松)', () => {
    expect([...charactersInArc(events, arcIdOf('武松'))]).toEqual([idOf('武松')]);
  });
});
