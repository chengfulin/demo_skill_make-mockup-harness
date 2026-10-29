# Data Model: 水滸傳角色事件時間軸（一頁式前端 POC）

**Feature**: `001-shuihu-timeline-poc` | **Date**: 2026-10-29 | **Plan**: [plan.md](./plan.md)

實體與規則依 spec「Key Entities」與 FR-001／FR-002／FR-013；資料來源為 Prototype v2 內嵌假資料 `[HO Q2]`。
執行期資料只經 `AP/src/data/loadDataset.ts` 取得（FR-021）。

## 1. 靜態資料檔

位置 `AP/public/data/`，建置時原樣複製到 `dist/data/`。全部為 UTF-8 JSON 陣列，鍵名 camelCase；領域值（群組、關係類型）保留 StoryBoard 中文用詞。

| 檔案 | 筆數 | 元素型別 |
| :---- | :---- | :---- |
| `arcs.json` | 12 | `Arc` |
| `chapters.json` | 120 | `Chapter` |
| `characters.json` | 22 | `Character` |
| `events.json` | 54 | `StoryEvent` |
| `places.json` | 32 | `Place` |
| `relations.json` | 13 | `Relation` |

### Arc（大節）

| 欄位 | 型別 | 說明 |
| :---- | :---- | :---- |
| `id` | string | `arc-01`～`arc-12` |
| `name` | string | 例「三打祝家莊」 |
| `chapters` | `[number, number]` | 起訖回（含），例 `[43, 50]` |

```json
{ "id": "arc-05", "name": "三打祝家莊", "chapters": [43, 50] }
```

### Chapter（章回）

| 欄位 | 型別 | 說明 |
| :---- | :---- | :---- |
| `no` | number | 1–120 |
| `label` | string | 回次，例「第八回」（取自 Prototype 回目前綴） |
| `title` | string | 回目，例「林教頭刺配滄州道 魯智深大鬧野豬林」 |

### Character（角色）

| 欄位 | 型別 | 說明 |
| :---- | :---- | :---- |
| `id` | string | 拼音 id，例 `linchong` |
| `name` | string | 姓名 |
| `nickname` | string \| null | 綽號顯示字串（原樣，含括號說明，例「及時雨（座次綽號：呼保義）」）；角色面板顯示此值 |
| `nicknames` | string[] | 綽號清單（搜尋與 chip 用，例 `["及時雨","呼保義"]`）；chip 顯示 `nicknames[0]` |
| `group` | `"天罡"` \| `"地煞"` \| `"其他"` | 星號群組；`其他` 即非一百單八將 |
| `star` | string \| null | 星號，例「天雄星」；非一百單八將為 null |
| `rank` | number \| null | 座次；非一百單八將為 null |
| `firstChapter` | number | 登場回 |
| `joinChapter` | number \| null | 上梁山回；從未上梁山為 null |
| `fateChapter` | number \| null | 結局回；無結局回（高俅）為 null |
| `fate` | string | 結局簡述 |
| `avatar` | string | 頭像字，預設姓名首字；Prototype 另有 4 個覆寫（阮小二「二」、阮小七「七」、楊志「志」、楊雄「雄」） |

```json
{ "id": "chaogai", "name": "晁蓋", "nickname": "托塔天王", "nicknames": ["托塔天王"],
  "group": "其他", "star": null, "rank": null,
  "firstChapter": 14, "joinChapter": 20, "fateChapter": 60,
  "fate": "攻打曾頭市時中史文恭毒箭，回山寨後身亡（不在一百單八將之列）", "avatar": "晁" }
```

### StoryEvent（事件）

| 欄位 | 型別 | 說明 |
| :---- | :---- | :---- |
| `id` | string | `ev-01`～`ev-54` |
| `title` | string | 事件名 |
| `chapters` | `[number, number]` | 起訖回（含） |
| `arc` | string | 所屬大節 id |
| `location` | string | 地點顯示字（例「信州龍虎山伏魔殿」「還道村」） |
| `place` | string \| null | 地點 id；無法在示意地圖定位為 null（目前僅 `ev-25` 九天玄女授天書／還道村） |
| `characters` | string[] | 參與角色 id（0～多位；Prototype 順序保留） |
| `summary` | string | 一兩句摘要 |

### Place（地點）

| 欄位 | 型別 | 說明 |
| :---- | :---- | :---- |
| `id` | string | 與名稱相同（例「梁山泊」） |
| `name` | string | 地點名 |
| `lon` | number | 示意經度 |
| `lat` | number | 示意緯度 |

是否在山東範圍不存欄位，由 `mapLayout.inScope` 以範圍框（經度 114.6–119.2、緯度 34.6–37.9）判定（spec Key Entities）。

### Relation（關係）

| 欄位 | 型別 | 說明 |
| :---- | :---- | :---- |
| `a`、`b` | string | 兩端角色 id（無方向） |
| `type` | `"結義"`\|`"師徒"`\|`"主僕"`\|`"仇敵"`\|`"夫妻"`\|`"兄弟"` | 關係類型（本資料出現 結義／主僕／兄弟／夫妻／仇敵） |
| `note` | string | 說明（節點連線的 `<title>` 與人物關係鈕的 title） |

## 2. Prototype 假資料轉換（`AP/scripts/convert-prototype-data.mjs`）

一次性腳本，實作階段執行一次並 commit 產出的 JSON；之後資料維護直接改 JSON。

1. 讀 `.specify/context/shuihu-timeline/v2/prototype/index.html`（唯讀），先比對 sha256 = `1df5b8df…8e48c`，不符即中止。
2. 以正規表示式取出 `<script>` 內 `const DATA = {…};` 那一行的物件字面值，`JSON.parse`（Prototype 的 DATA 是合法 JSON）。不執行 Prototype 的其他程式碼。
3. 正規化：
   - `chapters[].title`「第八回 林教頭…」→ 以第一個空白切成 `label`「第八回」與 `title`。
   - `characters[].nickname`：保留原字串為 `nickname`；`nicknames` = 去掉「（座次綽號：X）」後的主綽號，再加上 X（若有）；無綽號為 `null`／`[]`。
   - `characters[].star`／`rank`：Prototype 的 `undefined`／缺欄 → `null`；`group` 原樣（天罡／地煞／其他）。
   - `characters[].joinChapter`／`fateChapter`：缺欄 → `null`。丟棄 Prototype 註記欄 `fateNote`（僅高俅有，屬說明非資料）。
   - `characters[].avatar`：姓名首字，再套 Prototype `AVCH` 的 4 個覆寫（寫在腳本常數）。
   - `events[].place`：缺欄或空字串 → `null`；其餘原樣。
4. 依實體各寫一個檔，2 空白縮排；順序保留 Prototype 原順序（角色 chip 列順序即 `characters.json` 順序）。
5. 腳本最後呼叫與執行期相同的 `validateDataset`，失敗即非零結束。

## 3. 驗證規則（`validateDataset`，執行期與轉換腳本共用）

| # | 規則 | 依據 |
| :---- | :---- | :---- |
| V1 | 筆數：大節 12、章回 120、角色 22、事件 54、地點 32、關係 13 | FR-002 |
| V2 | 大節依序連續、不重疊，第一個起於 1、最後一個止於 120 | FR-001 |
| V3 | 事件 `1 ≤ 起回 ≤ 迄回 ≤ 120`，且起回落在所屬大節範圍內（迄回可延伸到下一大節；Prototype 資料 ev-16 柴進莊上會武松為第 22–23 回、屬 arc-02〔13–22〕，實作時發現，2026-10-29 修正） | FR-001 |
| V4 | 事件的 `arc`、`place`（非 null 時）、`characters[*]` 都存在 | FR-002 |
| V5 | 關係兩端角色存在，且 `type` 為六種之一 | FR-002 |
| V6 | 角色 `firstChapter ≤ joinChapter ≤ fateChapter`（有值者）；`group` 為天罡／地煞時 `star`、`rank` 非 null，其他時皆為 null | FR-013、FR-014 |
| V7 | id 唯一 | — |

任一規則失敗 → `loadDataset` 拋錯 → 畫面顯示載入失敗（FR-022），不顯示部分資料。

## 4. 執行期索引（`Dataset`，由 `buildIndex` 產生）

| 成員 | 內容 |
| :---- | :---- |
| `events` | 依起始回、再依迄回排序的事件陣列（全書順序；時間軸、上一個／下一個、角色參與事件共用） |
| `eventById`、`characterById`、`arcById`、`placeById`、`chapterByNo` | 對照表 |
| `eventsByCharacter` | 角色 → 依全書順序的事件 |
| `neighbors` | 角色 → 有關係的角色集合（關係圖一層） |
| `relationTypesPresent` | 資料中出現的關係類型（圖例只列這些，依關係首次出現順序） |

## 5. 衍生規則（純函式，`domain/`）

- **篩選** `filterEvents(events, selected, arcId)`：`(arcId 為空 或 e.arc = arcId) 且 (selected 為空 或 e.characters ∩ selected ≠ ∅)`（FR-003）。
- **角色在大節內** `charactersInArc(events, arcId)`：在該大節至少參與一個事件的角色集合（G-9）。
- **角色狀態** `statusAt(c, n)`：`fateChapter≠null 且 n≥fateChapter` → 已死亡或離散；否則 `joinChapter≠null 且 n≥joinChapter` → 已上梁山；否則 `n≥firstChapter` → 在野；否則 未登場（FR-013、D-2）。`statusSegments(c)` 把 1–120 回合併成連續區段。
- **天罡／地煞快選** `groupToggle(selected, members)`（`domain/selection.ts`；reducer action `toggleGroup` 帶群組成員 id 呼叫之）：成員未全選 → 加入全部並保留其他；已全選 → 只移除成員（G-7）。
- **搜尋** `matchCharacters(q)`：`name` 或 `nicknames` 任一包含 q（D-5）；`enterSelectTarget`：第一個符合者，已選或無符合 → 不動作（D-3）。
- **上一個／下一個** `prevNext(id, filtered, all)`：id 在 filtered 中用 filtered，否則用 all（G-2）。
- **行跡** `buildTrail(filtered, characterId)`：該角色、`place≠null` 的事件依全書順序取地點，連續相同者合併（G-3）。

## 6. 狀態轉換

角色狀態只會依章回單向前進：`未登場 → 在野 → 已上梁山 → 已死亡或離散`；未曾上梁山者 `在野 → 已死亡或離散`；無結局回者停在最後狀態（高俅全書在野）。

## 7. AC 數字核對（以 Prototype 假資料計算）

| AC | 需要的數字 | 資料算出 | 依賴欄位 |
| :---- | :---- | :---- | :---- |
| AC-P1 | 54 事件、12 大節 | 54、12 | events、arcs |
| AC-P3／AC-P4 | 武松 8；武松∪魯智深 14 | 8、14 | events.characters |
| AC-P9 | 天罡 17 位，不含晁蓋 | 17（晁蓋 group=其他） | characters.group |
| AC-P13 | 大節 1＋王英 = 0 | 0 | events.arc、characters |
| AC-P15 | 三打祝家莊 4 事件、第 43–50 回 | 4、[43,50] | arcs.chapters |
| AC-P16 | 征方臘＋武松：睦州血戰、魯智深擒方臘・浙江坐化 | 相符 | — |
| AC-P18 | 醉打蔣門神・血濺鴛鴦樓 第 28–31 回、4 條回目、孟州 | 相符 | chapters.title、events.location |
| AC-P20 | 林沖＋魯智深篩選中「大鬧野豬林」下一個＝棒打洪教頭 | 相符 | 全書排序 |
| AC-P22 | 晁蓋 未登場 13、在野 6、已上梁山 40、已死亡或離散 61 | 13／6／40／61（14、20、60） | first／join／fateChapter |
| AC-P23 | 高俅 未登場 1、在野 119 | 1／119（2、null、null） | 同上 |
| AC-S16 | 公孫勝結局回起已死亡或離散 | fateChapter=110 → 110–120 為已死亡或離散 | 同上 |
| AC-P26 | 只選武松：8 標記、1 條行跡 | 8 個相異地點 | events.place |
| AC-P27 | 武松＋宋江：1 個無法定位 | 1（還道村，place=null） | events.place |
| AC-P28 | 武松＋宋江點江州：3 事件 | 3 | events.place |
| AC-P30 | 林沖一層：魯智深、高俅 | 相符 | relations |
| AC-P36 | 山東範圍 15 地點、不含東京 | 15 | places.lon／lat |
| AC-P38 | 山東＋武松：4 標記 | 4（景陽岡、陽穀縣、青州、梁山泊） | 同上 |
| AC-P40 | 圖例不含「師徒」 | 類型＝結義／主僕／兄弟／夫妻／仇敵 | relations.type |
| AC-S2 | 參與角色 >3 的事件 | 15 個事件（如智取生辰綱 6 位） | events.characters |
| AC-S10 | 連續同地點合併 | 例：宋江江州、梁山泊連續多次 | events.place |
