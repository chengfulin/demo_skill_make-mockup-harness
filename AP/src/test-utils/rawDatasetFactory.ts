/**
 * 合成 `RawDataset` 產生器（T014；validateDataset 測試用）。
 *
 * 以程式產生筆數符合 data-model.md §3 V1 的合法資料（大節 12、章回 120、角色 22、
 * 事件 54、地點 32、關係 13），且 V2～V7 全部成立；每次呼叫回傳全新物件，
 * 測試可直接修改回傳值以逐項破壞規則。內容為合成值，不代表 Prototype 真實資料。
 */
import type {
  Arc,
  Chapter,
  Character,
  Place,
  RawDataset,
  Relation,
  RelationType,
  StoryEvent,
} from '../domain/types';

export const COUNTS = {
  arcs: 12,
  chapters: 120,
  characters: 22,
  events: 54,
  places: 32,
  relations: 13,
} as const;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 大節 i（1 起）涵蓋第 10(i−1)+1 至 10i 回，依序連續、不重疊。 */
function makeArcs(): Arc[] {
  return Array.from({ length: COUNTS.arcs }, (_, i) => ({
    id: `arc-${pad2(i + 1)}`,
    name: `大節${i + 1}`,
    chapters: [i * 10 + 1, i * 10 + 10],
  }));
}

function makeChapters(): Chapter[] {
  return Array.from({ length: COUNTS.chapters }, (_, i) => ({
    no: i + 1,
    label: `第${i + 1}回`,
    title: `回目${i + 1}`,
  }));
}

/** 角色 0–16 天罡、17–19 地煞、20–21 其他（20 有上山／結局回，21 皆為 null）。 */
function makeCharacters(): Character[] {
  return Array.from({ length: COUNTS.characters }, (_, i) => {
    const id = `c${pad2(i)}`;
    if (i < 20) {
      return {
        id,
        name: `角色${i}`,
        nickname: `綽號${i}`,
        nicknames: [`綽號${i}`],
        group: i < 17 ? '天罡' : '地煞',
        star: `星${i}`,
        rank: i + 1,
        firstChapter: 1 + i,
        joinChapter: 30 + i,
        fateChapter: 100 + i,
        fate: `結局${i}`,
        avatar: '角',
      } satisfies Character;
    }
    return {
      id,
      name: `角色${i}`,
      nickname: i === 20 ? `綽號${i}` : null,
      nicknames: i === 20 ? [`綽號${i}`] : [],
      group: '其他',
      star: null,
      rank: null,
      firstChapter: 2,
      joinChapter: i === 20 ? 20 : null,
      fateChapter: i === 20 ? 60 : null,
      fate: `結局${i}`,
      avatar: '角',
    } satisfies Character;
  });
}

function makePlaces(): Place[] {
  return Array.from({ length: COUNTS.places }, (_, i) => ({
    id: `地點${i}`,
    name: `地點${i}`,
    lon: 110 + i * 0.2,
    lat: 30 + i * 0.2,
  }));
}

/** 事件 i 落在大節 i mod 12：起訖回為該大節的第 1–2 回；最後一個事件 place 為 null。 */
function makeEvents(): StoryEvent[] {
  return Array.from({ length: COUNTS.events }, (_, i) => {
    const arcIndex = i % COUNTS.arcs;
    const start = arcIndex * 10 + 1;
    return {
      id: `ev-${pad2(i + 1)}`,
      title: `事件${i + 1}`,
      chapters: [start, start + 1],
      arc: `arc-${pad2(arcIndex + 1)}`,
      location: `地點${i % COUNTS.places}`,
      place: i === COUNTS.events - 1 ? null : `地點${i % COUNTS.places}`,
      characters: i % 9 === 0 ? [] : [`c${pad2(i % COUNTS.characters)}`, `c${pad2((i + 1) % COUNTS.characters)}`],
      summary: `摘要${i + 1}`,
    };
  });
}

const RELATION_TYPES: RelationType[] = ['結義', '師徒', '主僕', '仇敵', '夫妻', '兄弟'];

function makeRelations(): Relation[] {
  return Array.from({ length: COUNTS.relations }, (_, i) => ({
    a: `c${pad2(i)}`,
    b: `c${pad2(i + 1)}`,
    type: RELATION_TYPES[i % RELATION_TYPES.length],
    note: `說明${i}`,
  }));
}

/** 產生一份全新、通過 V1～V7 的合成資料。 */
export function makeRawDataset(): RawDataset {
  return {
    arcs: makeArcs(),
    chapters: makeChapters(),
    characters: makeCharacters(),
    events: makeEvents(),
    places: makePlaces(),
    relations: makeRelations(),
  };
}
