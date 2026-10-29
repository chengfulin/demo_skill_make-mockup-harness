# Implementation Plan: 水滸傳角色事件時間軸（一頁式前端 POC）

**Branch**: `001-shuihu-timeline-poc` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-shuihu-timeline-poc/spec.md`

**Note**: 由 `/speckit-plan`（spec-kit 1.0.13）產出。spec 為唯一權威；本計畫只決定「怎麼做」，業務規則與文案以 spec 及其規格來源為準。

## Summary

做一個純靜態的一頁式網站：時間軸、地圖、關係圖三個視圖共用一套角色／大節篩選，加上事件明細與角色資料兩種側邊面板（窄螢幕為底部抽屜）。
技術做法：React + TypeScript，Vite 建置；全部程式、設定與測試放在專案根下新資料夾 `AP/`（自成 npm 專案）。
資料是隨站台發布的靜態 JSON（初始內容由 Prototype 內嵌假資料轉出），只經資料存取層載入；篩選、狀態推算、版面計算都寫成純函式，由 React Context + useReducer 串起來。
地圖與關係圖用手寫 SVG，照 Prototype 的固定座標與排版；視覺透過 design token（模式 B，自 Prototype 萃取）。
驗證：Vitest + React Testing Library 測純函式與元件，Playwright 跑 AC 的 E2E，另有一支「Prototype 並列比對」E2E 重現 21 個截圖狀態。

## Technical Context

**Language/Version**: TypeScript 7.x（若工具鏈相容性不足退回 5.9）；Node.js 24 LTS（僅建置與測試用）

**Primary Dependencies**: React 19、react-dom 19、Vite 8、@vitejs/plugin-react 6；不引入 UI 元件庫、圖表或地圖套件、狀態管理套件、路由套件

**Storage**: 無後端。靜態 JSON 檔 `AP/public/data/*.json`，隨站台發布（見 [data-model.md](./data-model.md)）

**Testing**: Vitest 5 + @testing-library/react 16 + @testing-library/user-event 14 + jsdom（單元與元件）；@playwright/test 1.64（E2E 與 Prototype 並列比對，Chrome）

**Target Platform**: 現代瀏覽器 Chrome／Safari／Edge／Firefox 最新兩版；桌機 1440px 與手機 400px `[HO Q5]`

**Project Type**: 前端單頁應用（static SPA），無後端

**Performance Goals**: 無特別效能基準 `[HO Q5]`；資料量百筆內，全部在瀏覽器記憶體計算

**Constraints**: 頁面本身不得水平捲動（400px）；網址 hash 只記視圖不記篩選；不需離線可用，網路字型失敗退回系統字型 `[HO Q7]`；無機密

**Scale/Scope**: 22 角色、54 事件、12 大節、13 關係、32 地點、120 回；1 個頁面、6 個畫面區塊（S1～S6）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

導入階段 1：§CP-1～6 與 §GV 最小審查為 MUST；§TR、§FE、§DEP 為【參考】。風險分級初判 Experimental（POC）。

| 條款 | 判定 | 本計畫的落實方式 |
| :---- | :---- | :---- |
| §CP-1 可追溯 | PASS | 每個模組在「前端設計」節標出對應 FR／US；tasks 以 US 分組；測試名稱帶 AC 編號（AC-xx／AC-Pxx／AC-Sxx） |
| §CP-2 機密 | PASS | 純靜態站，無任何機密；`AP/.env.example` 只列非機密變數名稱；`.env*`（除 `.env.example`）列入 `AP/.gitignore` |
| §CP-3 設定不硬編碼 | PASS | 部署子路徑 `VITE_BASE_PATH`、資料位置 `VITE_DATA_BASE_URL` 由環境變數提供（預設值非機密、非環境敏感）；環境別用 Vite mode（`development`／`production`），程式以 `import.meta.env.MODE` 判斷 |
| §CP-4 核心邏輯測試 | PASS | 篩選、狀態推算、搜尋與 Enter、快選、上一個／下一個、時間軸排版、地圖投影／行跡／標記推開、關係圖排版與淡出、資料驗證、reducer 全部是純函式並有 Vitest 測試；測試檔開頭附 ISP 分割表（Experimental：主要流程範圍，Base Choice），外部依賴（fetch）以 stub 隔離 |
| §CP-5 審查 | PASS（流程） | 每個 US 走 PR，AI 可審查、人為核准合併；PR 連結本 spec |
| §CP-6 例外可追蹤 | PASS | 無 MUST 例外。SHOULD 層級的偏離（§FE-1 框架）記於下方「偏離紀錄」 |
| §GV-3 B 人工審查清單 | PASS（流程） | 審查時逐項確認：spec 一致、分層（見「元件分層」）、變更範圍（見 §TR-8 宣告）、ISP 分割表、例外紀錄、風險分級標示 Experimental |
| §TR-8【參考】 | 已宣告 | 見「變更影響範圍」 |
| §FE-1【參考】 | 偏離，已說明 | 見「偏離紀錄」 |
| §FE-2【參考】 | 預設豁免（§GV-2 Experimental） | GitHub Pages 無法自訂回應標頭；`index.html` 以 `<meta http-equiv="Content-Security-Policy">` 限定 self＋Google Fonts，作為最低限度 |
| §FE-3／§FE-5【參考】 | 符合 | 前端無機密；不使用 `dangerouslySetInnerHTML`，所有文字由 React 轉義輸出 |
| §FE-4【參考】 | 符合 | 展示元件／容器／資料存取層／狀態層分離（見「元件分層」）；視圖切換集中在 `useHashView` |
| §FE-6／§FE-7【參考】 | 符合 | 語意化標籤、鍵盤可操作（Enter／Space／Escape）、ARIA；Vitest + RTL 取代建議的 Vue Test Utils（隨框架偏離），Playwright 做 E2E |
| §DEP【參考】 | 不適用 | 純靜態網站，不容器化 |

**Phase 1 設計後複查**：資料模型、UI 契約與 quickstart 均未引入後端、機密或新的 MUST 例外，判定維持全部 PASS。

### 偏離紀錄（§FE-1）

| 項目 | tech-standards 建議 | 本 feature 採用 | 理由 |
| :---- | :---- | :---- | :---- |
| 前端框架 | Vue 3（Composition API、`<script setup>`）＋ Nuxt 3 | React 19 + TypeScript，Vite 建置的純靜態 SPA | 使用者指定 React + TypeScript，用於驗證 SDD 流程的 POC；純靜態一頁式不需要 Nuxt 的路由與 runtimeConfig |
| 共用狀態 | Pinia | React Context + useReducer | 隨框架改變；狀態只有一組篩選與 UI 狀態，不需狀態管理套件 |
| 元件測試 | Vitest + Vue Test Utils | Vitest + React Testing Library | 隨框架改變 |

## 變更影響範圍（§TR-8）

```text
受影響模組：全新前端專案 AP/（資料檔、資料存取、狀態、視圖元件、測試）
變更分層：Presentational／Container／Data access（service）／State（store）／Domain（純函式），全部在 AP/ 下
主要檔案區域：AP/src/**、AP/public/data/*.json、AP/e2e/**、AP/scripts/convert-prototype-data.mjs、AP 根的設定檔
不受影響：make-mockups/、.specify/context/（唯讀來源包）、.specify/memory/、repo 根（不放 package.json）
```

## Project Structure

### Documentation (this feature)

```text
specs/001-shuihu-timeline-poc/
├── spec.md              # 唯一權威（含規格來源段、偏離登記）
├── plan.md              # 本檔
├── research.md          # Phase 0：技術決策、設計 token
├── data-model.md        # Phase 1：實體、JSON 檔結構、Prototype 假資料轉換
├── quickstart.md        # Phase 1：安裝、開發、測試、建置、E2E
├── contracts/
│   └── ui-contracts.md  # Phase 1：S1～S6 逐畫面契約、畫面對照、偏離
└── tasks.md             # Phase 2（/speckit-tasks 產出，非本階段）
```

### Source Code（`AP/`，專案根下自成一個 npm 專案）

```text
AP/
├── package.json  vite.config.ts  vitest.setup.ts  playwright.config.ts
├── tsconfig.json  index.html  .env.example  .gitignore
├── public/
│   └── data/                      # 靜態 JSON（隨站台發布；結構見 data-model.md）
│       ├── arcs.json  chapters.json  characters.json
│       └── events.json  places.json  relations.json
├── scripts/
│   └── convert-prototype-data.mjs # 一次性：Prototype 內嵌 DATA → public/data/*.json
├── src/
│   ├── main.tsx  App.tsx
│   ├── config.ts                  # 讀 import.meta.env（BASE_URL、VITE_DATA_BASE_URL）
│   ├── domain/                    # 純函式，不 import React
│   │   ├── types.ts               # 實體型別（Arc/Chapter/Character/Event/Place/Relation/Dataset）
│   │   ├── filter.ts              # filterEvents、charactersInArc
│   │   ├── status.ts              # statusAt、statusSegments、milestones
│   │   ├── search.ts              # matchCharacters、enterSelectTarget
│   │   ├── selection.ts           # toggle、groupToggle、only、remove、clear
│   │   ├── navigation.ts          # prevNext（篩選結果或全書順序）
│   │   ├── timelineLayout.ts      # 章回寬度、大節色帶、刻度、車道（lane）配置
│   │   ├── mapLayout.ts           # 範圍、投影、inScope、標記推開、行跡、無法定位計數
│   │   ├── mapGeometry.ts         # 示意底圖折線（海、遼東、黃河、長江）常數
│   │   ├── graphLayout.ts         # 環序、中心／一層／二層座標、淡出（含大節，D-1／G-9）
│   │   └── format.ts              # 章回區間文字（第 a–b 回、a–b回）
│   ├── data/
│   │   ├── loadDataset.ts         # 資料存取層：fetch 6 個 JSON → validate → buildIndex
│   │   ├── validateDataset.ts     # 結構與參照完整性檢查（失敗即整體失敗，不給部分資料）
│   │   └── DatasetProvider.tsx    # loading／error／ready＋retry 的 Context
│   ├── state/
│   │   ├── appReducer.ts          # 篩選與 UI 狀態的 reducer（純函式）
│   │   ├── AppStateProvider.tsx   # Context + useReducer
│   │   ├── selectors.ts           # useFilteredEvents、useResultCount 等
│   │   └── useHashView.ts         # #timeline／#map／#graph ↔ view
│   ├── components/                # 展示元件（只吃 props，不碰 Context／fetch）
│   │   ├── Masthead/  FilterBar/  Timeline/  EventDetail/  CharacterDetail/
│   │   └── MapView/  GraphView/  Drawer/  EmptyState/  LoadState/  Avatar/
│   ├── containers/                # 容器：讀 Context、dispatch、組裝展示元件
│   │   ├── FilterBarContainer.tsx  TimelineContainer.tsx  MapContainer.tsx
│   │   └── GraphContainer.tsx  EventDrawerContainer.tsx  CharacterDrawerContainer.tsx
│   └── styles/
│       ├── tokens.css             # design token（淺色／深色），清單見 research.md
│       └── base.css               # reset、字型、全域排版
├── e2e/
│   ├── fixtures/prototypeStates.ts  # 21 個截圖狀態的重現步驟（compare 與 AC 共用）
│   ├── us1-timeline.spec.ts … us7-graph.spec.ts  # AC／AC-P／AC-S
│   └── prototype-compare.spec.ts  # 並列比對：截圖＋DOM 斷言
└── test-results/                  # 產物（gitignore）；compare/ 放並列比對截圖
```

**Structure Decision**: 單一前端專案，全部在 `AP/`。`domain/` 是無框架的純函式層（核心邏輯與測試集中處）；`data/` 是唯一碰 `fetch` 的地方；`state/` 管跨元件狀態；`components/` 與 `containers/` 分展示與編排。單元測試與被測檔同目錄（`*.test.ts(x)`），E2E 在 `AP/e2e/`。

## 前端設計（依 Prototype v2）

本節是 plan 對 Prototype 的設計解讀；逐畫面的區塊順序、逐字文案與狀態見 [contracts/ui-contracts.md](./contracts/ui-contracts.md)，token 見 [research.md「設計 token」](./research.md#設計-token)，資料見 [data-model.md](./data-model.md)。

### 頁面骨架

由上而下：`Masthead`（印章＋「水滸時間軸」＋副標）→ `FilterBar`（S1：搜尋／天罡／地煞／大節選單 → 角色 chip 列 → 已選標籤列 → 結果數＋視圖分頁）→ `main`（三個視圖只顯示一個：S2／S5／S6）→ 疊在最上層的 `Drawer`（S3 或 S4，同時最多開一個）與遮罩。
FilterBar 不 sticky（Prototype 為一般文件流），但三個視圖都渲染它（FR-005、AC-S13）。

### 元件分層（§FE-4）

| 層 | 位置 | 職責 | 不得做 |
| :---- | :---- | :---- | :---- |
| 展示元件 | `src/components/**` | 依 props 畫 DOM／SVG、發出 callback | 讀 Context、fetch、自行計算篩選 |
| 容器 | `src/containers/**`、`App.tsx` | 從 Context 取資料與狀態、呼叫 `domain/` 純函式、dispatch | 直接 fetch、寫死資料 |
| 資料存取 | `src/data/**` | 讀 JSON、驗證、建索引（`Dataset`） | 被展示元件 import |
| 狀態 | `src/state/**` | reducer、selector、hash 同步 | 持有資料內容（資料由 DatasetProvider 提供） |
| 領域純函式 | `src/domain/**` | 全部業務規則與版面計算 | import React 或 DOM |

### 資料存取層（FR-021、FR-022）

- `loadDataset(baseUrl)` 以 `Promise.all` 讀 6 個 JSON；任一失敗或驗證失敗 → 整體 `error`，不提供部分資料。
- `validateDataset` 檢查筆數與參照完整性（事件的 arc／place／characters、關係兩端都存在；大節連續涵蓋 1–120），失敗細節只進 console，畫面顯示通用錯誤文案。
- `buildIndex` 產出 `Dataset`：依起始回排序的事件陣列、`byId` 對照表、角色→事件、角色鄰接表（關係圖用）、地點對照。
- `DatasetProvider` 狀態：`loading` → 顯示載入提示；`error` → 錯誤訊息＋「重試」；`ready` → 渲染 App（AC-S4、AC-S5）。
- `baseUrl` 來自 `VITE_DATA_BASE_URL`（預設 `${import.meta.env.BASE_URL}data/`）。

### 狀態（React Context + useReducer）

```text
AppState = {
  selected: CharacterId[]      // 依加入順序（已選標籤照此順序）
  arcId: ArcId | null          // null = 全部大節
  query: string                // 搜尋框
  view: 'timeline'|'map'|'graph'
  mapScope: 'all'|'sd'
  focusPlace: PlaceId | null   // 地圖高亮與側欄
  drawer: {kind:'event', id} | {kind:'character', id} | null
}
```

Actions：`toggleCharacter`、`addCharacter`、`removeCharacter`、`clearCharacters`、`onlyCharacter`、`toggleGroup(天罡|地煞)`（G-7）、`submitSearch`（D-3：只選取不取消）、`setQuery`、`selectArc`、`clearFilters`（角色＋大節）、`setView`、`setMapScope`、`focusPlace`、`goToPlace`（關面板、切地圖、地點不在山東範圍時切回全圖）、`openEvent`、`openCharacter`、`closeDrawer`。
reducer 只呼叫 `domain/selection.ts` 等純函式；篩選結果不存 state，由 selector 以 `filterEvents(dataset, selected, arcId)` 即時算出（`useMemo`）。

### 路由（hash）

- `useHashView`：初始化讀 `location.hash`，`#timeline`／`#map`／`#graph` 以外（含空）一律 `timeline`（AC-S17）；`setView` 時以 `history.replaceState` 寫回 hash，並監聽 `hashchange`。篩選不寫入網址（FR-005）。

### 時間軸（S2，FR-006／FR-007）

- `timelineLayout(events, range, availableWidth)`：每回寬 `max(30, floor(可用寬 / 回數))` px；事件卡寬 `max(170, 跨回寬 − 8)`；以貪婪法分配車道（lane 高 70、間距 8），重疊事件自動錯開（AC-S1）。
- 版面：大節色帶（奇數條底色交替）→ 章回刻度（起始回與每 10 回標數字）→ 車道。橫向在容器內捲動。
- 事件卡：頂部色條（跨回）或圓點（單回）、事件名、章回區間、頭像最多 3 個（已選角色排前並加朱色外框）＋「+N」，無角色時「（無收錄角色）」。
- ≤720px：改為依大節分組的直向列表（AC-P42），大節標題按鈕同樣選取大節。

### 地圖（S5，FR-015～FR-018）手寫 SVG

- 兩個固定範圍（Prototype 原值）：全圖 viewBox 860×700、經度 105–122.5、緯度 27–41.5；山東 860×620、經度 114.6–119.2、緯度 34.6–37.9。等距投影 `x=(lon−lon0)/(lon1−lon0)·W`、`y=(lat1−lat)/(lat1−lat0)·H`。
- 圖層順序：陸地底 → 海、遼東 → 黃河（全圖另有長江）→ 地名註記 → 梁山泊水域橢圓 → 山東框（僅全圖，可點，文案「山東 · 點此放大」）→ 行跡 → 標記。
- 標記：半徑 `(山東 12｜全圖 9) + min(事件數, 8)·1.3`；相鄰標記以 40 輪兩兩推開（間距 山東 6／全圖 2），只影響顯示位置；標籤靠右，近右緣改靠左（AC-16／AC-P37 標籤不重疊）。
- 行跡（只選一位角色）：取篩選結果中該角色、可定位的事件，連續同地點合併（G-3），依投影座標畫紅色虛線，各段中點標順序號 1…n。
- 無法定位計數 `N 個事件無法標示地點`（右上角）、「示意，非精確測繪」（左下角）。地圖正下方是同寬的精簡章回刻度（FR-018）。
- 側欄：地點面板（未選地點時提示，選了列出該地事件）＋行跡／目前篩選說明。

### 關係圖（S6，FR-019）手寫 SVG

- viewBox 820×720，中心 (410,360)。中心：已選角色（未選時宋江）；一層：與中心有關係者；其餘為二層。
- 座標：單一中心放正中；多個中心排在半徑 `min(40+12n, 130)` 的小圈；一層半徑 175（多中心 220），自 −90°+0.2 rad 起；二層半徑 315，自 −90° 起。環內順序用 Prototype 的固定環序（`graphLayout.ts` 常數，資料中有、環序沒有的角色依資料順序補在最後）。
- 淡出：有已選角色時，非中心且非一層者淡出；已選大節時再加上「在該大節沒有參與事件者淡出（含已選本人）」（D-1、G-9）；邊只在兩端都可見且（未選角色或連到中心）時清楚顯示。全部淡出時覆蓋 `EmptyState`（「沒有符合條件的事件」＋「清除篩選」）。
- 節點色依星號群組；邊的樣式依關係類型；圖例只列資料中出現的類型，附說明文字（D-4：依目前是否已選角色決定是否加「；未選角色時以宋江為中心」）。
- 互動：點節點開角色資料；節點「＋」加入篩選（已選節點不顯示「＋」）；節點位移以 CSS transition（`prefers-reduced-motion` 時關閉）。

### 面板（S3／S4）

- 共用 `Drawer`：右側 `min(440px, 100%)` 寬，≤720px 改為全寬、高 82% 的底部抽屜；遮罩點擊或 Escape 關閉；開啟另一個面板即取代。
- 事件明細（FR-012）：頁首「事件 · 大節名」→ 標題＋章回＋大節 → 摘要 → 回目 → 地點（可定位為按鈕「<地點> · 在地圖上看」，否則徽章「<地點>（無法在示意地圖上定位）」）→ 參與角色（頭像＝加入篩選且面板維持開啟；名字＝角色資料；「已在篩選中」）→ 底部上一個／下一個（`navigation.prevNext`：在篩選結果中就用篩選結果，否則全書順序；首尾停用並顯示「已是第一個／最後一個」）。
- 角色資料（FR-013／FR-014）：頭像＋姓名＋綽號＋星號座次或「非一百單八將」→ 狀態條（`statusSegments` 產生 1–120 回的四色區段與三節點標記）→ 結局 →「只看此角色」→ 參與事件（數量）→ 人物關係。

### 主題與響應式

- 只跟隨系統 `prefers-color-scheme`（G-5），token 兩套值；不提供切換鈕。
- 斷點：≤900px 地圖側欄移到地圖下方；≤720px 角色 chip 列改為橫向捲動、時間軸改直向列表、面板改底部抽屜；SVG 寬 100% 自動縮放（AC-S6）。

### Prototype 並列比對 E2E（SC-003）

- `e2e/fixtures/prototypeStates.ts` 定義 21 個狀態（與 `handoff-notes.md`「截圖索引」同名同序），每個狀態是一串 UI 操作步驟（不直接改 state），步驟表見 [ui-contracts「畫面對照」](./contracts/ui-contracts.md#畫面對照)。
- `e2e/prototype-compare.spec.ts`：Chrome、viewport 1440×900、`colorScheme: 'light'`；每個狀態開新頁 `goto('/#timeline')` → 執行步驟 → 等動畫結束 → `fullPage` 截圖存成 `AP/test-results/compare/<截圖檔名>.png`（與 `.specify/context/shuihu-timeline/v2/prototype/screens/` 同名），再以 DOM 斷言檢查：
  1. 區塊順序：各 `data-page="S<n> …"` 區塊的直接子區塊依 ui-contracts 所列順序出現；
  2. 逐字文案：ui-contracts 該狀態列出的字串都出現在對應區塊的 `innerText`（比對前把連續空白壓成一個，並移除中文與數字之間的空白，例如「共 54 個事件」與「共54個事件」視為相同）；
  3. 狀態：結果數、已選標籤、`aria-pressed`／`aria-selected`、淡出節點數等。
- 實作 MUST 保留 Prototype 的 `data-page` 屬性值（如 `S1 角色篩選列`）與 ui-contracts 列出的 `data-testid`，供 compare 與 AC E2E 定位。
- 視覺並列檢核（區塊順序、相對位置、文案、狀態標籤四項）由人以截圖對看；色彩、字型渲染、像素位移不計（SC-003）。Playwright `outputDir` 設為 `test-results/playwright`，避免清掉 `test-results/compare/`。

## Complexity Tracking

無違反憲章 MUST 的項目，不需填寫。
