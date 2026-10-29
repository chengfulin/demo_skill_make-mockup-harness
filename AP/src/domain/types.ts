/**
 * 領域型別（data-model.md §1 靜態資料檔、§4 執行期索引）。
 *
 * 只用可抹除語法（type／interface，不用 enum／namespace），
 * 讓 `src/data/validateDataset.ts` 以 `import type` 引入後，
 * `scripts/convert-prototype-data.mjs` 能經 Node 24 原生型別剝除直接 import（tsconfig `erasableSyntaxOnly`）。
 */

/** 星號群組；`其他` 即非一百單八將。 */
export type CharacterGroup = '天罡' | '地煞' | '其他';

/** 關係類型（六種；本資料出現 結義／主僕／兄弟／夫妻／仇敵）。 */
export type RelationType = '結義' | '師徒' | '主僕' | '仇敵' | '夫妻' | '兄弟';

/** 角色在某一回的狀態（data-model.md §5、§6；FR-013）。 */
export type CharacterStatus = '未登場' | '在野' | '已上梁山' | '已死亡或離散';

/** 章回區間：起訖回（含）。 */
export type ChapterRange = [number, number];

/** 大節（`arcs.json`）。 */
export interface Arc {
  /** `arc-01`～`arc-12` */
  id: string;
  /** 大節名，例「三打祝家莊」 */
  name: string;
  /** 起訖回（含），例 `[43, 50]` */
  chapters: ChapterRange;
}

/** 章回（`chapters.json`）。 */
export interface Chapter {
  /** 1–120 */
  no: number;
  /** 回次，例「第八回」（取自 Prototype 回目前綴） */
  label: string;
  /** 回目，例「林教頭刺配滄州道 魯智深大鬧野豬林」 */
  title: string;
}

/** 角色（`characters.json`）。 */
export interface Character {
  /** 拼音 id，例 `linchong` */
  id: string;
  /** 姓名 */
  name: string;
  /** string | null，綽號顯示字串（原樣，含括號說明）；角色面板顯示此值 */
  nickname: string | null;
  /** 綽號清單（搜尋與 chip 用）；chip 顯示 `nicknames[0]` */
  nicknames: string[];
  /** 星號群組 */
  group: CharacterGroup;
  /** 星號，例「天雄星」；非一百單八將為 null */
  star: string | null;
  /** 座次；非一百單八將為 null */
  rank: number | null;
  /** 登場回 */
  firstChapter: number;
  /** 上梁山回；從未上梁山為 null */
  joinChapter: number | null;
  /** 結局回；無結局回（高俅）為 null */
  fateChapter: number | null;
  /** 結局簡述 */
  fate: string;
  /** 頭像字，預設姓名首字（Prototype 另有 4 個覆寫） */
  avatar: string;
}

/** 事件（`events.json`）。 */
export interface StoryEvent {
  /** `ev-01`～`ev-54` */
  id: string;
  /** 事件名 */
  title: string;
  /** 起訖回（含） */
  chapters: ChapterRange;
  /** 所屬大節 id */
  arc: string;
  /** 地點顯示字（例「信州龍虎山伏魔殿」「還道村」） */
  location: string;
  /** string | null；地點 id，無法在示意地圖定位為 null */
  place: string | null;
  /** 參與角色 id（0～多位；Prototype 順序保留） */
  characters: string[];
  /** 一兩句摘要 */
  summary: string;
}

/** 地點（`places.json`）。是否在山東範圍不存欄位，由 `mapLayout.inScope` 判定。 */
export interface Place {
  /** 與名稱相同（例「梁山泊」） */
  id: string;
  /** 地點名 */
  name: string;
  /** 示意經度 */
  lon: number;
  /** 示意緯度 */
  lat: number;
}

/** 關係（`relations.json`）。 */
export interface Relation {
  /** 兩端角色 id（無方向） */
  a: string;
  /** 兩端角色 id（無方向） */
  b: string;
  /** 關係類型 */
  type: RelationType;
  /** 說明（節點連線的 `<title>` 與人物關係鈕的 title） */
  note: string;
}

/** 6 個靜態資料檔的原始內容（順序同檔案）。 */
export interface RawDataset {
  arcs: Arc[];
  chapters: Chapter[];
  characters: Character[];
  events: StoryEvent[];
  places: Place[];
  relations: Relation[];
}

/**
 * 執行期索引（由 `buildIndex` 產生，data-model.md §4）。
 * 保留原始陣列（角色 chip 列順序即 `characters` 順序）；`events` 改為全書順序。
 */
export interface Dataset {
  arcs: readonly Arc[];
  chapters: readonly Chapter[];
  characters: readonly Character[];
  places: readonly Place[];
  relations: readonly Relation[];
  /** 依起始回、再依迄回排序的事件陣列（全書順序；時間軸、上一個／下一個、角色參與事件共用） */
  events: readonly StoryEvent[];
  eventById: ReadonlyMap<string, StoryEvent>;
  characterById: ReadonlyMap<string, Character>;
  arcById: ReadonlyMap<string, Arc>;
  placeById: ReadonlyMap<string, Place>;
  chapterByNo: ReadonlyMap<number, Chapter>;
  /** 角色 → 依全書順序的事件 */
  eventsByCharacter: ReadonlyMap<string, readonly StoryEvent[]>;
  /** 角色 → 有關係的角色集合（關係圖一層） */
  neighbors: ReadonlyMap<string, ReadonlySet<string>>;
  /** 資料中出現的關係類型（圖例只列這些，依關係首次出現順序） */
  relationTypesPresent: readonly RelationType[];
}
