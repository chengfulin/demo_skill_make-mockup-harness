---

description: "Task list for 001-shuihu-timeline-poc（水滸傳角色事件時間軸，一頁式前端 POC）"
---

# Tasks: 水滸傳角色事件時間軸（一頁式前端 POC）

**Input**: Design documents from `specs/001-shuihu-timeline-poc/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/ui-contracts.md、quickstart.md

**Tests**: 需要。憲章 §CP-4 要求核心邏輯有自動化測試（domain 純函式、data、state reducer 皆以 Vitest 測，測試檔開頭附 ISP 分割表：Experimental、主要流程範圍、Base Choice）；spec 的 87 條驗收情境（AC 18＋AC-P 42＋AC-S 27）以 Playwright E2E 逐條對應，測試名稱以 AC 編號開頭（例 `AC-P3 選武松結果數為 8`）。各 story phase 內測試先寫（先紅後綠）。

**Organization**: 依 user story 分 phase（US1–US5 為 P1、US6–US7 為 P2）。phase 依序執行；同一 phase 內標 `[P]` 的任務彼此檔案不重疊、可並行。

## Format: `[ID] [P?] [Story] [S<n>] Description`

- **[P]**：可並行（不同檔案、不依賴同組其他未完成任務）
- **[Story]**：所屬 user story（US1～US7）；Setup／Foundational／Polish 不標
- **[S<n>]**：對應 Prototype 畫面（S1 角色篩選列、S2 時間軸、S3 事件明細面板、S4 角色資料面板、S5 地圖、S6 關係圖），契約見 `contracts/ui-contracts.md` 同名章節
- 所有路徑相對專案根；程式一律在 `AP/`（自成 npm 專案，指令在 `AP/` 下執行）
- 同一檔案被多個任務修改時，描述中寫「（修改）」；跨 story 熱點見文末「跨 story 共用熱點檔」

## Path Conventions

- 原始碼 `AP/src/`（`domain/` 純函式、`data/` 資料存取、`state/` 狀態、`components/` 展示元件、`containers/` 容器、`styles/` token 與全域樣式）
- 單元／元件測試與被測檔同目錄（`*.test.ts(x)`）；E2E 在 `AP/e2e/`
- 靜態資料 `AP/public/data/*.json`；一次性轉換腳本 `AP/scripts/convert-prototype-data.mjs`
- 唯讀來源：`.specify/context/shuihu-timeline/v2/prototype/index.html`（只讀，不修改）

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立 `AP/` npm 專案與工具鏈設定（plan「Technical Context」、research R1／R6／R7／R8）

- [X] T001 建立 `AP/package.json`：`"private": true`、`"type": "module"`、`engines.node >=24`；dependencies 只有 react 19、react-dom 19；devDependencies：typescript 7.x（工具鏈不相容時退回 5.9）、vite 8、@vitejs/plugin-react 6、vitest 5、jsdom、@testing-library/react 16、@testing-library/user-event 14、@testing-library/jest-dom、@playwright/test 1.64、eslint、typescript-eslint、eslint-plugin-react-hooks、@types/react、@types/react-dom、@types/node；不得引入 UI 元件庫、圖表／地圖套件、狀態管理套件、路由套件。scripts：`dev`、`build`（`tsc --noEmit && vite build`）、`preview`、`typecheck`（`tsc --noEmit`）、`lint`（`eslint .`）、`test`（`vitest run`）、`test:watch`（`vitest`）、`e2e`（`playwright test --project=chrome`）、`e2e:compare`（`playwright test --project=compare`）、`e2e:browsers`（`playwright test --project=webkit --project=firefox --project=msedge --grep @demo`）、`data:convert`（`node scripts/convert-prototype-data.mjs`）
- [X] T002 [P] 建立 `AP/tsconfig.json`：`strict`、`jsx: react-jsx`、`moduleResolution: bundler`、`noEmit`、`erasableSyntaxOnly: true`（讓 `src/data/validateDataset.ts` 可被 Node 24 原生型別剝除直接 import）、`allowImportingTsExtensions`、`resolveJsonModule`；include `src`、`e2e`、`scripts`、`vite.config.ts`、`vitest.setup.ts`、`playwright.config.ts`；types `vite/client`、`vitest/globals`、`node`
- [X] T003 [P] 建立 `AP/vite.config.ts`：`base` 取 `loadEnv` 的 `VITE_BASE_PATH`（預設 `/`）、`@vitejs/plugin-react`；`test`：`environment: 'jsdom'`、`globals: true`、`setupFiles: ['./vitest.setup.ts']`、`include: ['src/**/*.test.{ts,tsx}']`；以 `transformIndexHtml` 外掛只在 build（`apply: 'build'`）時於 `<head>` 注入 `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' <資料 origin>">`：build 時以 `loadEnv` 讀 `VITE_DATA_BASE_URL`，有設定且為絕對網址時以 `new URL(...).origin` 取出 origin 加進 `connect-src`，未設定（或為相對路徑）時 `connect-src` 只有 `'self'`（plan §FE-2、§CP-3；dev 不注入以免擋 react-refresh）
- [X] T004 [P] 建立 `AP/vitest.setup.ts`：載入 `@testing-library/jest-dom/vitest`；`window.matchMedia` stub（預設淺色、寬 >720px，可由測試覆寫）、`ResizeObserver` stub；每測 `cleanup`
- [X] T005 [P] 建立 `AP/playwright.config.ts`：`testDir: 'e2e'`、`outputDir: 'test-results/playwright'`（不可清掉 `test-results/compare/`）、port 取環境變數 `E2E_PORT`（預設 `4173`）、`baseURL` 取 `E2E_BASE_URL`（預設 `http://localhost:${port}/`），`webServer` 執行 `npm run build && npm run preview -- --port ${port} --strictPort`（§CP-3，不寫死）；projects：`chrome`（`channel: 'chrome'`、viewport 1440×900、`colorScheme: 'light'`、`testIgnore: /prototype-compare/`；需 400px 的測試在檔內以 `test.use({ viewport: { width: 400, height: 800 } })` 切換）、`compare`（只跑 `prototype-compare.spec.ts`，Chrome 1440×900 淺色）、`webkit`、`firefox`、`msedge`（`channel: 'msedge'`，使用本機 Edge）（三者供 `e2e:browsers` 以 `@demo` 抽驗，SC-004、D-6）；`chrome`、`compare` 以 `channel: 'chrome'` 使用本機 Chrome
- [X] T006 [P] 建立 `AP/eslint.config.js`：typescript-eslint recommended、react-hooks；分層規則（plan「元件分層」§FE-4）以 `no-restricted-imports` 落實：`src/domain/**` 不得 import `react`／`react-dom`／`src/{components,containers,state,data}`；`src/components/**` 不得 import `src/{containers,state,data}`；`src/**`（測試檔與 `src/test-utils/**` 除外）不得 import `public/data/*.json`（FR-021）；`no-restricted-syntax` 禁用 JSX 屬性 `dangerouslySetInnerHTML`（§FE-5）
- [X] T007 [P] 建立 `AP/.env.example`（只列 `VITE_BASE_PATH=/` 與註解掉的 `VITE_DATA_BASE_URL=`，附用途說明，皆非機密）與 `AP/.gitignore`（`node_modules/`、`dist/`、`test-results/`、`playwright-report/`、`.env*` 並以 `!.env.example` 排除）（§CP-2、§CP-3）
- [X] T008 [P] 建立 `AP/index.html`：`<html lang="zh-Hant">`、viewport meta、`<title>水滸時間軸</title>`、Google Fonts 連結（LXGW WenKai TC 400/700、Noto Sans TC 400/500/700，`display=swap`，research R8）、`<div id="root">`、`<script type="module" src="/src/main.tsx">`（CSP 由 T003 於 build 注入）
- [X] T009 於 `AP/` 執行 `npm install` 產生 `AP/package-lock.json`，並執行 `npx playwright install chromium` 與 `npx playwright install webkit firefox`（依賴 T001）；`chrome`／`compare`／`msedge` project 以 channel 使用本機安裝的 Chrome／Edge，不由 Playwright 下載

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 型別、資料檔與資料存取層、共用純函式、狀態骨架、共用展示元件、App 殼與 E2E 共用工具。所有 user story 依賴本 phase。

**⚠️ CRITICAL**: 本 phase 完成前不得開始任何 user story

### 型別、設定與樣式

- [X] T010 [P] 建立 `AP/src/domain/types.ts`：依 data-model.md §1 定義 `Arc`、`Chapter`、`Character`、`StoryEvent`、`Place`、`Relation`、`RawDataset`（6 個陣列）、`Dataset`（§4 索引成員）、`CharacterGroup = "天罡" | "地煞" | "其他"`、`RelationType = "結義"|"師徒"|"主僕"|"仇敵"|"夫妻"|"兄弟"`、`CharacterStatus = "未登場"|"在野"|"已上梁山"|"已死亡或離散"`；欄位約束原文寫入 JSDoc：Arc.id「`arc-01`～`arc-12`」、Arc.chapters「起訖回（含）」；Chapter.no「1–120」；Character.nickname「string \| null，綽號顯示字串（原樣，含括號說明）」、nicknames「綽號清單（搜尋與 chip 用）；chip 顯示 `nicknames[0]`」、star「非一百單八將為 null」、rank「非一百單八將為 null」、joinChapter「從未上梁山為 null」、fateChapter「無結局回（高俅）為 null」；StoryEvent.id「`ev-01`～`ev-54`」、place「string \| null；無法在示意地圖定位為 null」、characters「參與角色 id（0～多位；Prototype 順序保留）」；Relation.a/b「兩端角色 id（無方向）」；只用可抹除語法（不用 enum／namespace）
- [X] T011 [P] 建立 `AP/src/config.ts` 與 `AP/src/config.test.ts`：`dataBaseUrl` = `import.meta.env.VITE_DATA_BASE_URL` 或預設 `${import.meta.env.BASE_URL}data/`（確保結尾 `/`）；`isProduction` 以 `import.meta.env.MODE` 判斷（§CP-3、research R7）；測試涵蓋有設定／未設定／缺結尾斜線
- [X] T012 [P] 建立 `AP/src/styles/tokens.css`：依 research.md「設計 token」節逐項定義（色彩 21 個、陰影 `--shadow`、字型 `--f-display`／`--f-ui` 沿用 Prototype 原名，師徒關係色、遮罩、字級、間距、圓角、尺寸、`--bp-sheet: 720px`、`--bp-map-stack: 900px`、`--size-page-max: 1440px`），淺色值在 `:root`，深色值在 `@media (prefers-color-scheme: dark)`；不提供切換鈕（G-5、FR-020）
- [X] T013 [P] 建立 `AP/src/styles/base.css`：reset、字型堆疊（LXGW WenKai TC／Noto Sans TC 後接系統字型 fallback，HO Q7）、`body` 底色與文字色取 token、內容最大寬 `var(--size-page-max)`；400px 下頁面本身不得水平溢出（不以 `overflow-x: hidden` 掩蓋）；`@media (prefers-reduced-motion: reduce)` 關閉 transition

### 資料檔與資料存取層（FR-021、FR-022、data-model.md）

- [X] T014 [P] 撰寫 `AP/src/data/validateDataset.test.ts` 與測試工具 `AP/src/test-utils/rawDatasetFactory.ts`（以程式產生筆數符合 V1 的合成 `RawDataset`，可逐項破壞）：逐條涵蓋 data-model.md §3 V1「筆數：大節 12、章回 120、角色 22、事件 54、地點 32、關係 13」、V2「大節依序連續、不重疊，第一個起於 1、最後一個止於 120」、V3「事件 `1 ≤ 起回 ≤ 迄回 ≤ 120`，且起回落在所屬大節範圍內」、V4「事件的 `arc`、`place`（非 null 時）、`characters[*]` 都存在」、V5「關係兩端角色存在，且 `type` 為六種之一」、V6「角色 `firstChapter ≤ joinChapter ≤ fateChapter`（有值者）；`group` 為天罡／地煞時 `star`、`rank` 非 null，其他時皆為 null」、V7「id 唯一」；檔頭附 ISP 分割表
- [X] T015 實作 `AP/src/data/validateDataset.ts`（依賴 T010、T014）：回傳 `{ ok: true } | { ok: false, errors: string[] }`；只用 `import type` 引入型別、不 import 其他執行期模組，確保 `scripts/convert-prototype-data.mjs` 能以 Node 24 型別剝除直接 import
- [X] T016 建立 `AP/scripts/convert-prototype-data.mjs`（依賴 T015）：依 data-model.md §2 步驟 1–5：讀 `../.specify/context/shuihu-timeline/v2/prototype/index.html`（唯讀），sha256 須等於 `1df5b8df97ce5aefd3304a18ef277e573f5825bab78ca514a8053eb229b8e48c`，不符即非零結束；以正規表示式取出 `const DATA = {…};` 物件字面值 `JSON.parse`，不執行 Prototype 其他程式碼；正規化 chapters（第一個空白切 `label`／`title`）、nickname／nicknames（去掉「（座次綽號：X）」後的主綽號再加 X）、star／rank／joinChapter／fateChapter 缺欄→`null`、丟棄 `fateNote`、avatar（姓名首字＋`AVCH` 4 個覆寫：阮小二「二」、阮小七「七」、楊志「志」、楊雄「雄」，寫成腳本常數）、events.place 缺欄或空字串→`null`；保留原順序，2 空白縮排寫出 6 檔；最後呼叫 `validateDataset`，失敗非零結束
- [X] T017 於 `AP/` 執行 `npm run data:convert` 產生 `AP/public/data/arcs.json`、`AP/public/data/chapters.json`、`AP/public/data/characters.json`、`AP/public/data/events.json`、`AP/public/data/places.json`、`AP/public/data/relations.json`（依賴 T016）；核對筆數 12／120／22／54／32／13，抽查 `ev-25` 的 `place` 為 `null`、晁蓋 14／20／60、高俅 `joinChapter`／`fateChapter` 為 `null`
- [X] T018 [P] 撰寫 `AP/src/data/loadDataset.test.ts`：以 stub 取代 `fetch`；6 檔全成功→回傳 `Dataset`；任一檔 HTTP 失敗、JSON 解析失敗或 `validateDataset` 失敗→整體 reject、不回傳部分資料（FR-022）；`buildIndex`：`events` 依起始回再依迄回排序、5 個 byId／byNo 對照表、`eventsByCharacter` 依全書順序、`neighbors` 雙向、`relationTypesPresent` 依關係首次出現順序；檔頭附 ISP 分割表
- [X] T019 實作 `AP/src/data/loadDataset.ts`（依賴 T015、T018）：`loadDataset(baseUrl)` 以 `Promise.all` 讀 6 個 JSON → `validateDataset` → `buildIndex`（同檔 export）；失敗細節只寫 console，丟出通用錯誤
- [X] T020 建立測試工具 `AP/src/test-utils/realDataset.ts`（依賴 T017、T019）：以 node `fs` 讀 `AP/public/data/*.json` 後呼叫 `buildIndex`，提供 domain／state／元件測試共用的真實資料（AC 數字當 oracle，research R6）

### 共用純函式與狀態骨架

- [X] T021 [P] 撰寫 `AP/src/domain/filter.test.ts`（用 `realDataset`）：`filterEvents` 未篩選 54、武松 8、武松＋魯智深 14、林沖 10、天罡 17 位 52、林沖＋宋江 31、大節三打祝家莊 4、征方臘＋武松＝睦州血戰與魯智深擒方臘・浙江坐化、誤走妖魔・魯智深與林沖＋王英 0；`charactersInArc` 回傳在該大節至少參與一事件的角色（G-9）；檔頭附 ISP 分割表
- [X] T022 [P] 撰寫 `AP/src/domain/format.test.ts`：明細用「第 28–31 回」「第 8 回」、清單用「28–31回」「8回」、大節選項「<大節名>（第 a–b 回）」（含「魂聚蓼兒洼（第 120–120 回）」）、色帶「a–b」
- [X] T023 [P] 撰寫 `AP/src/domain/mapLayout.test.ts`（範圍部分）：兩個範圍常數（全圖 viewBox 860×700、經度 105–122.5、緯度 27–41.5；山東 860×620、經度 114.6–119.2、緯度 34.6–37.9）、等距投影 `x=(lon−lon0)/(lon1−lon0)·W`、`y=(lat1−lat)/(lat1−lat0)·H`、`inScope`：32 地點中山東 15 個且不含東京（AC-P36 的資料基礎）
- [X] T024 [P] 撰寫 `AP/src/state/appReducer.test.ts`（基礎）：初始狀態 `selected: []`、`arcId: null`、`query: ''`、`view` 取參數、`mapScope: 'all'`、`focusPlace: null`、`drawer: null`；`setView`；`openEvent`、`openCharacter`（開啟另一個面板即取代）、`closeDrawer`
- [X] T025 [P] 實作 `AP/src/domain/filter.ts`：`filterEvents(events, selected, arcId)` =「(arcId 為空 或 e.arc = arcId) 且 (selected 為空 或 e.characters ∩ selected ≠ ∅)」（FR-003）；`charactersInArc(events, arcId)`（G-9）
- [X] T026 [P] 實作 `AP/src/domain/format.ts`：章回區間與大節標籤文字函式（T022 所列格式）
- [X] T027 [P] 實作 `AP/src/domain/mapLayout.ts`（範圍部分）：`MAP_SCOPES`（`all`／`sd`）常數、`project(scope, lon, lat)`、`inScope(scope, place)`；US6 會再擴充本檔
- [X] T028 [P] 實作 `AP/src/state/appReducer.ts`：`AppState`（plan「狀態」節的 7 個欄位）、`Action` 聯集（本 phase 先有 `setView`、`openEvent`、`openCharacter`、`closeDrawer`，各 story 再加）、`createInitialState(view)`、`appReducer`（純函式，不持有資料內容）
- [X] T029 實作 `AP/src/state/AppStateProvider.tsx`（依賴 T028）：Context + `useReducer`，export `AppStateProvider`、`useAppState`、`useAppDispatch`
- [X] T030 [P] [S1] 建立 `AP/src/components/LoadState/LoadState.tsx` 與 `AP/src/components/LoadState/LoadState.test.tsx`：依 `contracts/ui-contracts.md`「載入狀態」節：載入中 `role="status"`、`data-testid="loading"`、「資料載入中…」；失敗 `role="alert"`、`data-testid="load-error"`、「資料載入失敗，請稍後再試。」＋按鈕「重試」（`onRetry`）；樣式沿用 EmptyState 類別
- [X] T031 實作 `AP/src/data/DatasetProvider.tsx` 與 `AP/src/data/DatasetProvider.test.tsx`（依賴 T019）：Context 提供 `{ status: 'loading'|'error'|'ready', dataset, retry }`，載入器可注入（測試以 stub）；error 時不提供任何部分資料；`retry` 重新載入；export `useDataset`
- [X] T032 實作 `AP/src/state/selectors.ts`（依賴 T025、T029、T031）：`useFilteredEvents()`（`useMemo` 包 `filterEvents(dataset.events, selected, arcId)`，結果不存 state）、`useResultCount()`

### 共用展示元件與 App 殼

- [X] T033 [P] [S2] [S3] [S4] [S6] 建立 `AP/src/components/Avatar/Avatar.tsx`、`AP/src/components/Avatar/Avatar.css`、`AP/src/components/Avatar/Avatar.test.tsx`：吃 `avatar` 字、`group`（決定 token 色）、`highlighted`（朱色外框）、`size`；`aria-hidden`（文字由外層提供）
- [X] T034 [P] [S2] [S5] [S6] 建立 `AP/src/components/EmptyState/EmptyState.tsx`、`AP/src/components/EmptyState/EmptyState.css`、`AP/src/components/EmptyState/EmptyState.test.tsx`：依 `contracts/ui-contracts.md`「S2 時間軸」逐字文案：標題「沒有符合條件的事件」、說明「目前的角色與大節組合下沒有事件。」、按鈕「清除篩選」（`onClear`）；`overlay` prop 供地圖／關係圖覆蓋使用
- [X] T035 [P] [S3] [S4] 建立 `AP/src/components/Drawer/Drawer.tsx`、`AP/src/components/Drawer/Drawer.css`、`AP/src/components/Drawer/Drawer.test.tsx`：依 `contracts/ui-contracts.md`「S3」「S4」區塊順序的共用殼：`aside.drawer`，`data-page`／`aria-label`／`data-testid` 由 props 帶入；頁首 `dh` = 類別字 → 關閉鈕「×」（`aria-label="關閉"`）；遮罩點擊與 Escape 觸發 `onClose`（G-10、AC-S24）；寬 `min(440px, 100%)`，≤720px 為全寬、高 82% 底部抽屜（FR-012、FR-014、FR-020）
- [X] T036 [P] 建立 `AP/src/components/Masthead/Masthead.tsx` 與 `AP/src/components/Masthead/Masthead.css`（FR-024）：依 `contracts/ui-contracts.md`「頁首」：印章「水」「滸」「年」「表」2×2（`aria-hidden`）→ `h1`「水滸時間軸」→ 副標「依百二十回本《水滸全傳》章回 · 收錄 <N> 位人物、<M> 件事」（N、M 由 props 帶入，不寫死；`counts` 為 `null` 時不渲染副標）
- [X] T037 建立 `AP/src/main.tsx`、`AP/src/App.tsx`、`AP/src/App.test.tsx`（依賴 T029、T030、T031、T036）：`main.tsx` 載入 `tokens.css`、`base.css`，渲染 `DatasetProvider` > `AppStateProvider` > `App`；`App` 永遠渲染 `Masthead`，`status` 為 loading／error 時只渲染 `LoadState`（S1～S6 不渲染），ready 時渲染 `<main>`（內容由 US1 起逐步填入）；`App.test.tsx` 以 stub 載入器驗證載入中提示、失敗＋「重試」後成功（元件層的 AC-S4／AC-S5）
- [X] T038 [P] 建立 E2E 共用工具 `AP/e2e/fixtures/app.ts`：`gotoApp(page, hash?)`（等 `data-testid="loading"` 消失）、`pickCharacter(name)`（點 chip 的 pick 鈕）、`openCharacterInfo(name)`（`aria-label="<姓名> 角色資料"`）、`selectArc(name)`（`select[aria-label="大節"]`）、`switchView('時間軸'|'地圖'|'關係圖')`（`role="tab"`）、`resultCount()`、`normalizeText(s)`（連續空白壓成一個、移除中文與數字間空白）、`hasNoHorizontalScroll(page)`；定位依 `contracts/ui-contracts.md` 的 `data-page`／`data-testid`／role／label

**Checkpoint**: 資料檔、資料存取層、狀態骨架與共用元件就緒；`npm test` 綠燈，`npm run dev` 可看到頁首與載入流程

---

## Phase 3: User Story 1 - 瀏覽全書時間軸 (Priority: P1) 🎯 MVP

**Goal**: 進站看到依章回排列、以 12 個大節分段的 54 個事件；結果數與視圖分頁常駐；點事件卡開啟事件明細；網址 hash 記住視圖。

**Independent Test**: 只實作時間軸與資料載入，進站即驗證 54 個事件依章回排列並以 12 個大節分段，點事件卡可開啟明細（`AP/e2e/us1-timeline.spec.ts` 全綠）。

### Tests for User Story 1 ⚠️（先寫，確認失敗）

- [X] T039 [P] [US1] [S2] 撰寫 `AP/src/domain/timelineLayout.test.ts`（用 `realDataset`）：每回寬 `max(30, floor(可用寬 / 回數))`、事件卡寬 `max(170, 跨回寬 − 8)`；貪婪車道配置下任兩張卡在同車道不重疊（AC-S1）；全書 12 條大節色帶、奇數條標記交替底色；刻度＝起始回與每 10 回（1、10…120；43–50 為 43、50）；每回寬 ≥60px 每回畫短刻度，否則每 5 回；檔頭附 ISP 分割表
- [X] T040 [P] [US1] 撰寫 `AP/src/state/useHashView.test.ts`：hash 空、`#foo` → `timeline`（AC-S17）；`#map`、`#graph` 對應；`setView` 以 `history.replaceState` 寫回；`hashchange` 事件同步；篩選不寫入網址（FR-005）
- [X] T041 [P] [US1] [S2] 撰寫 `AP/src/components/Timeline/Timeline.test.tsx`：依 `contracts/ui-contracts.md`「S2 時間軸」：`section[data-page="S2 時間軸"]`、`data-testid="timeline"` 內順序 色帶 → 刻度 → 車道；`EventCard`（`data-testid="event-card"`）事件名、「第 a–b 回／第 n 回」、單回圓點／跨回色條、頭像最多 3 個＋「+N」（AC-S2）、已選角色頭像排前並帶外框、「（無收錄角色）」；窄螢幕（matchMedia ≤720px）改渲染 `data-testid="timeline-list"` 依大節分組
- [X] T042 [P] [US1] [S1] 撰寫 `AP/src/components/FilterBar/FilterBar.test.tsx`：依 `contracts/ui-contracts.md`「S1 角色篩選列」：`section.filter[data-page="S1 角色篩選列"]` 四個區塊順序（row → chars → sel → bar）；`ResultCount`（`data-testid="result-count"`、`aria-live="polite"`）「共 <N> 個事件」；`ViewTabs` `role="tablist"`、三個 `role="tab"`「時間軸」「地圖」「關係圖」、目前視圖 `aria-selected="true"`、點擊呼叫 `onChange`
- [X] T043 [P] [US1] [S1] [S2] [S3] 撰寫 `AP/e2e/us1-timeline.spec.ts`：逐條 AC-01、AC-02、AC-P1、AC-P2、AC-P41、AC-P42（400×800：`timeline-list` 顯示且頁面無水平捲動）、AC-S1（車道卡片外框兩兩不相交）、AC-S2、AC-S3（`page.emulateMedia({ colorScheme: 'dark' | 'light' })` 比對 `body` 背景色不同且分別等於 token 值）、AC-S4（`page.route` 延遲 `data/*.json`，見 `loading` 且無 `event-card`）、AC-S5（第一次 abort、按「重試」後放行，見「共 54 個事件」）、AC-S17（共 12 條）；AC-S6 於 Polish 的 `AP/e2e/responsive.spec.ts`；AC-S13 需大節選單（US3 才建），於 US3 的 `AP/e2e/us3-arc-filter.spec.ts`（T078）驗

### Implementation for User Story 1

- [X] T044 [P] [US1] [S2] 實作 `AP/src/domain/timelineLayout.ts`：常數 `UNIT_MIN=30`、`CARD_MIN=170`、`LANE_H=70`、`LANE_GAP=8`（research「版面常數」）；`timelineLayout(events, arcs, range, availableWidth)` 回傳每回寬、色帶、刻度、卡片座標與車道數；`range` 參數供 US3 傳大節區間
- [X] T045 [P] [US1] 實作 `AP/src/state/useHashView.ts`：`readHashView()`（非 `#timeline`／`#map`／`#graph` 一律 `timeline`）、`writeHashView(view)`（`replaceState`）、`useHashSync(view, onChange)`
- [X] T046 [US1] 修改 `AP/src/state/AppStateProvider.tsx`（依賴 T045）：初始 `view` 取 `readHashView()`；`view` 變動寫回 hash；監聽 `hashchange` 時 dispatch `setView`
- [X] T047 [P] [US1] 建立 `AP/src/components/hooks/useMediaQuery.ts` 與 `AP/src/components/hooks/useElementWidth.ts`（`ResizeObserver` 量容器寬，供時間軸每回寬計算）
- [X] T048 [P] [US1] [S2] 建立 `AP/src/components/Timeline/EventCard.tsx`：props `event`、`characters`、`selectedIds`（預設空，已選頭像排前並 `highlighted`）、`onOpen`；`<button>`、`data-testid="event-card"`；文案依 `contracts/ui-contracts.md`「S2」事件卡列
- [X] T049 [P] [US1] [S2] 建立 `AP/src/components/Timeline/ArcBands.tsx` 與 `AP/src/components/Timeline/ChapterRuler.tsx`：色帶每段為按鈕「<大節名> ／ <a>–<b>」，奇數條底色 `--paper-2`，`onSelectArc` 為選用 prop（US3 接上）；刻度依 `timelineLayout` 結果
- [X] T050 [US1] [S2] 建立 `AP/src/components/Timeline/TimelineLanes.tsx`（依賴 T048）：依版面結果絕對定位 `EventCard`，容器內橫向捲動
- [X] T051 [US1] [S2] 建立 `AP/src/components/Timeline/TimelineList.tsx`（依賴 T048）：`data-testid="timeline-list"`，依大節分組：組標題（大節名按鈕＋「第 <a>–<b> 回」，`onSelectArc` 選用）→ 事件列（「<a>–<b>」或「<n>」＋ `EventCard`）（AC-P42）
- [X] T052 [US1] [S2] 建立 `AP/src/components/Timeline/Timeline.tsx` 與 `AP/src/components/Timeline/Timeline.css`（依賴 T047、T049、T050、T051）：`section[data-page="S2 時間軸"]`；寬螢幕渲染 `tl-scroll`（`data-testid="timeline"`）內 色帶 → 刻度 → 車道，≤720px（`useMediaQuery`）只渲染 `TimelineList`；`empty` 插槽在結果為 0 時取代車道（US2 使用）
- [X] T053 [P] [US1] [S1] 建立 `AP/src/components/FilterBar/FilterBar.tsx`、`AP/src/components/FilterBar/ResultCount.tsx`、`AP/src/components/FilterBar/ViewTabs.tsx`、`AP/src/components/FilterBar/FilterBar.css`：`section.filter[data-page="S1 角色篩選列"]` 依序 4 個插槽 row／chars（`data-testid="char-list"`）／sel（`data-testid="selected-bar"`）／bar；bar = `ResultCount` → `ViewTabs`；row／chars／sel 內容由 US2、US3 填入（FR-005）
- [X] T054 [P] [US1] [S3] 建立 `AP/src/components/EventDetail/EventDetail.tsx` 與 `AP/src/components/EventDetail/EventDetail.css`（最小版）：依 `contracts/ui-contracts.md`「S3」內容 ① 標題區：`h2`<事件名> ＋「第 <a>–<b> 回 ／ 大節 <大節名>」；其餘區塊於 US4 補上
- [X] T055 [US1] [S2] 建立 `AP/src/containers/TimelineContainer.tsx`（依賴 T032、T044、T052）：取 `useFilteredEvents`、`dataset`，以 1–120 回呼叫 `timelineLayout`，點卡 dispatch `openEvent`
- [X] T056 [US1] [S1] 建立 `AP/src/containers/FilterBarContainer.tsx`（依賴 T032、T053）：結果數用 `useResultCount`，視圖分頁 dispatch `setView`
- [X] T057 [US1] [S3] 建立 `AP/src/containers/EventDrawerContainer.tsx`（依賴 T035、T054）：`Drawer`（`data-page="S3 事件明細面板"`、`aria-label="事件明細"`、`data-testid="event-drawer"`、類別字「事件 · <大節名>」）包 `EventDetail`；關閉 dispatch `closeDrawer`
- [X] T058 [US1] 修改 `AP/src/App.tsx`（依賴 T046、T055、T056、T057）：ready 時渲染 `Masthead`（帶角色數、事件數）→ `FilterBarContainer` → `<main>`（`view` 為 timeline 渲染 `TimelineContainer`；map／graph 暫以空的 `section[data-page="S5 地圖"]`、`section[data-page="S6 關係圖"]` 佔位，US6／US7 取代）→ `drawer.kind === 'event'` 時渲染 `EventDrawerContainer`
- [X] T059 [US1] 於 `AP/` 執行 `npm test`、`npm run typecheck`、`npm run lint`、`npx playwright test e2e/us1-timeline.spec.ts --project=chrome`，修正至全綠

**Checkpoint**: US1 可獨立展示（MVP）：時間軸、結果數、視圖分頁、hash、載入狀態、事件明細標題

---

## Phase 4: User Story 2 - 選擇角色篩選事件 (Priority: P1)

**Goal**: 角色多選聯集、搜尋（姓名與綽號清單）、Enter 只選取、天罡／地煞快選（G-7）、已選標籤移除與清除、空狀態。

**Independent Test**: 在時間軸之上加入角色選擇列，驗證多選聯集、搜尋、Enter 選取、快選、標籤移除與清除（`AP/e2e/us2-character-filter.spec.ts` 全綠；空狀態 AC-P13、AC-P14 需大節選單，於 US3 的 `AP/e2e/us3-arc-filter.spec.ts` 驗）。

### Tests for User Story 2 ⚠️

- [X] T060 [P] [US2] [S1] 撰寫 `AP/src/domain/selection.test.ts`：`toggle`、`add`（不重複、保留加入順序）、`remove`、`clear`、`only`、`groupToggle(selected, members)`：未全選→加入全部並保留其他、已全選→只移除成員（G-7）；以真實資料驗 天罡 17 位不含晁蓋（AC-P9）、再按清空（AC-P10）、地煞（AC-S7）、晁蓋＋天罡＝18（AC-S8）、再按只剩晁蓋（AC-S9）；檔頭附 ISP 分割表
- [X] T061 [P] [US2] [S1] 撰寫 `AP/src/domain/search.test.ts`：`matchCharacters(characters, q)` 比對 `name` 或 `nicknames` 任一包含 q（D-5）：豹子頭→林沖、黑旋風→李逵、孫悟空→空、座次→空、呼保義→宋江；空字串→全部；`enterSelectTarget(matches, selected)`：第一個符合者未選→其 id，已選或無符合→`null`（D-3、AC-S19）
- [X] T062 [P] [US2] 修改 `AP/src/state/appReducer.test.ts`：新增 `toggleCharacter`、`addCharacter`（面板維持開啟）、`removeCharacter`、`clearCharacters`、`toggleGroup`、`setQuery`、`submitSearch`（D-3：只選取不取消）、`clearFilters`（清角色與大節）
- [X] T063 [P] [US2] [S1] 撰寫 `AP/src/components/FilterBar/CharacterFilter.test.tsx`：依 `contracts/ui-contracts.md`「S1」逐字文案與狀態：`SearchBox` `type="search"`、placeholder「搜尋姓名或綽號，例如：黑旋風」、`aria-label="搜尋角色"`、Enter 呼叫 `onSubmit`；`GroupToggle`「天罡」「地煞」`aria-pressed`；`CharacterChip` pick 鈕 `aria-pressed`、顯示「<頭像字> <姓名> <nicknames[0]>」（高俅只顯示姓名）、提供 `onInfo` 時才渲染「i」鈕（`aria-label="<姓名> 角色資料"`、`title="角色資料"`）；`CharacterList` 無結果顯示「找不到符合的角色」取代整個清單；`SelectedTags` 未選「未選角色，顯示全部角色的事件」、有選「已選」＋「<姓名> ×」（`aria-label="移除 <姓名>"`，依加入順序）＋「清除全部」
- [X] T064 [P] [US2] [S1] [S2] 撰寫 `AP/e2e/us2-character-filter.spec.ts`：逐條 AC-03、AC-04、AC-05、AC-06、AC-07、AC-P3、AC-P4、AC-P5、AC-P6、AC-P7、AC-P8、AC-P9、AC-P10、AC-P11、AC-P12、AC-P33（在 `#graph` 以篩選列選 2 位後切回時間軸）、AC-P34、AC-S7、AC-S8、AC-S9、AC-S19、AC-S21（共 22 條；AC-P13、AC-P14 需大節選單，移至 T078）

### Implementation for User Story 2

- [X] T065 [P] [US2] [S1] 實作 `AP/src/domain/selection.ts`：`toggle`、`add`、`remove`、`clear`、`only`（US5「只看此角色」使用）、`groupToggle`
- [X] T066 [P] [US2] [S1] 實作 `AP/src/domain/search.ts`：`matchCharacters`、`enterSelectTarget`
- [X] T067 [US2] 修改 `AP/src/state/appReducer.ts`（依賴 T065、T066）：加入 T062 所列 actions；`toggleGroup` payload 帶群組成員 id（由容器自資料算出，reducer 不持有資料）；`submitSearch` payload 帶 `enterSelectTarget` 結果
- [X] T068 [P] [US2] [S1] 建立 `AP/src/components/FilterBar/SearchBox.tsx`（左側放大鏡 SVG、即打即篩 `onChange`、Enter `onSubmit`）
- [X] T069 [P] [US2] [S1] 建立 `AP/src/components/FilterBar/GroupToggle.tsx`（前置群組色圓點、`aria-pressed`＝群組已全選、全選時底色反白）
- [X] T070 [P] [US2] [S1] 建立 `AP/src/components/FilterBar/CharacterChip.tsx` 與 `AP/src/components/FilterBar/CharacterList.tsx`（chip 用 `Avatar`；已選外框與底色換 accent；清單依 `characters.json` 順序；無結果文案）
- [X] T071 [P] [US2] [S1] 建立 `AP/src/components/FilterBar/SelectedTags.tsx`
- [X] T072 [US2] [S1] 修改 `AP/src/components/FilterBar/FilterBar.tsx` 與 `AP/src/components/FilterBar/FilterBar.css`（依賴 T068–T071）：row 插槽依序 搜尋框 → 天罡 → 地煞（大節選單留給 US3）；chars、sel 插槽；≤720px chip 列改單列橫向捲動
- [X] T073 [US2] [S1] 修改 `AP/src/containers/FilterBarContainer.tsx`（依賴 T067、T072）：以 `matchCharacters` 篩清單、Enter 以 `enterSelectTarget` dispatch `submitSearch`、群組成員自 `dataset` 依 `group` 算出並判定 `aria-pressed`、標籤移除與清除全部
- [X] T074 [US2] [S2] 修改 `AP/src/containers/TimelineContainer.tsx`（依賴 T067）：把 `selected` 傳給 `EventCard`（AC-P5）；結果為 0 時以 `EmptyState` 填 `Timeline` 的 `empty` 插槽，「清除篩選」dispatch `clearFilters`（AC-P13、AC-P14 的實作；E2E 於 US3 T078 驗）
- [X] T075 [US2] 於 `AP/` 執行 `npm test`、`npm run typecheck`、`npm run lint`、`npx playwright test e2e/us1-timeline.spec.ts e2e/us2-character-filter.spec.ts --project=chrome`，修正至全綠

**Checkpoint**: US1＋US2 皆可獨立運作

---

## Phase 5: User Story 3 - 依大節篩選 (Priority: P1)

**Goal**: 大節單選（選單或點時間軸大節標題），與角色篩選取交集，時間軸只顯示該大節章回與事件。

**Independent Test**: 在時間軸加入大節選單，驗證單選大節、點大節標題、與角色篩選的交集，以及 US2 的空狀態（AC-P13、AC-P14）與 US1 的篩選區常駐（AC-S13）（`AP/e2e/us3-arc-filter.spec.ts` 全綠）。

### Tests for User Story 3 ⚠️

- [X] T076 [P] [US3] 修改 `AP/src/state/appReducer.test.ts`：新增 `selectArc(id | null)`；與既有角色選取並存
- [X] T077 [P] [US3] [S1] 撰寫 `AP/src/components/FilterBar/ArcSelect.test.tsx`：依 `contracts/ui-contracts.md`「S1」：`<select aria-label="大節">`，第一項「全部大節（第 1–120 回）」值為空，其餘「<大節名>（第 <a>–<b> 回）」12 項
- [X] T078 [P] [US3] [S1] [S2] 撰寫 `AP/e2e/us3-arc-filter.spec.ts`：逐條 AC-08、AC-09、AC-P15、AC-P16、AC-P17（點色帶「武松」後選單值變為該大節）、AC-S14，以及需大節選單、自 US1／US2 移入的 AC-P13、AC-P14（US2 的空狀態與「清除篩選」）、AC-S13（US1：切三個視圖時 S1 的 chip 列、大節選單、已選列、結果數、視圖分頁都渲染於頁面上方，不要求捲動時固定；地圖／關係圖此時為佔位區塊亦適用）（共 9 條）

### Implementation for User Story 3

- [X] T079 [US3] 修改 `AP/src/state/appReducer.ts`：加入 `selectArc`
- [X] T080 [P] [US3] [S1] 建立 `AP/src/components/FilterBar/ArcSelect.tsx`（選項文字用 `format.ts`）
- [X] T081 [US3] [S1] 修改 `AP/src/components/FilterBar/FilterBar.tsx`（依賴 T080）：row 插槽在「地煞」後放 `ArcSelect`
- [X] T082 [US3] [S1] 修改 `AP/src/containers/FilterBarContainer.tsx`（依賴 T079、T081）：傳 `arcs`、目前 `arcId`，變更 dispatch `selectArc`
- [X] T083 [US3] [S2] 修改 `AP/src/containers/TimelineContainer.tsx`（依賴 T079）：選了大節時以該大節 `chapters` 為 `timelineLayout` 的 range（只畫該大節色帶、刻度 43、50）；`ArcBands` 與 `TimelineList` 組標題的 `onSelectArc` dispatch `selectArc`（AC-P17）
- [X] T084 [US3] 於 `AP/` 執行 `npm test`、`npm run typecheck`、`npm run lint`、`npx playwright test e2e/us1-timeline.spec.ts e2e/us2-character-filter.spec.ts e2e/us3-arc-filter.spec.ts --project=chrome`，修正至全綠

**Checkpoint**: US1～US3 皆可獨立運作

---

## Phase 6: User Story 4 - 檢視事件明細 (Priority: P1)

**Goal**: 事件明細面板完整資訊（章回、回目、大節、地點、參與角色、摘要），頭像加入篩選、名字開角色資料、地點切地圖、上一個／下一個。

**Independent Test**: 從時間軸點事件卡開啟面板，驗證資訊欄位、頭像加入篩選、地點切地圖、無法定位地點與上一個／下一個（`AP/e2e/us4-event-detail.spec.ts` 全綠；AC-S15 需 US5 的角色資料入口，於 Phase 7 驗）。

### Tests for User Story 4 ⚠️

- [X] T085 [P] [US4] [S3] 撰寫 `AP/src/domain/navigation.test.ts`：`prevNext(id, filtered, all)`：id 在 filtered 中用 filtered，否則用 all（G-2）；林沖＋魯智深篩選中「大鬧野豬林」下一個＝棒打洪教頭（AC-P20）；只選林沖時「大鬧野豬林」前一個＝林沖誤入白虎堂；首／尾回傳 `null`；檔頭附 ISP 分割表
- [X] T086 [P] [US4] 修改 `AP/src/state/appReducer.test.ts`：新增 `goToPlace`（關面板、`view='map'`、設 `focusPlace`；payload 的 `inShandong` 為 false 且目前 `mapScope='sd'` 時切回 `all`，G-10、AC-S23）；`addCharacter` 不關面板（AC-P19）
- [X] T087 [P] [US4] [S3] 撰寫 `AP/src/components/EventDetail/EventDetail.test.tsx`：依 `contracts/ui-contracts.md`「S3」：內容順序 標題區 → 摘要 → 回目 → 地點 → 參與角色；小標「回目」「地點」「參與角色」；回目逐回列出（28–31 回 4 條）；可定位地點為按鈕「<location> · 在地圖上看」、不可定位為徽章「<location>（無法在示意地圖上定位）」；參與角色頭像鈕 `title="加入篩選"`、`aria-label="將 <姓名> 加入篩選"`、已選者外框＋「已在篩選中」、提示「點頭像加入篩選，點名字看角色資料。」、無角色「本事件沒有收錄名單中的角色。」；底部「← <前一事件名>」「<下一事件名> →」，首尾停用並顯示「← 已是第一個」「已是最後一個 →」
- [X] T088 [P] [US4] [S3] 撰寫 `AP/e2e/us4-event-detail.spec.ts`：逐條 AC-10、AC-11、AC-P18、AC-P19、AC-P20、AC-P21（本檔驗：點地點後面板關閉、hash `#map`、「地圖」分頁 `aria-selected`；地圖上的標記高亮於 US6 `AP/e2e/us6-map.spec.ts` 補驗）、AC-S26（已選林沖開「倒拔垂楊柳・林沖結義」：「← 已是第一個」停用、下一個「林沖誤入白虎堂 →」）、AC-S27（「九天玄女授天書」地點為徽章「還道村（無法在示意地圖上定位）」、無「在地圖上看」按鈕）（共 8 條）；AC-S15 見 T102

### Implementation for User Story 4

- [X] T089 [P] [US4] [S3] 實作 `AP/src/domain/navigation.ts`：`prevNext`
- [X] T090 [US4] 修改 `AP/src/state/appReducer.ts`：加入 `goToPlace`（payload `{ placeId, inShandong }`，`inShandong` 由容器以 `mapLayout.inScope('sd', place)` 算出）
- [X] T091 [P] [US4] [S3] 建立 `AP/src/components/EventDetail/EventChapters.tsx`（「<第八回> <回目>」逐回）
- [X] T092 [P] [US4] [S3] 建立 `AP/src/components/EventDetail/EventPlace.tsx`（可定位按鈕／不可定位徽章）
- [X] T093 [P] [US4] [S3] 建立 `AP/src/components/EventDetail/EventParticipants.tsx`（頭像鈕 `onAdd`、名字鈕 `onOpenCharacter`、「已在篩選中」、提示與無角色文案）
- [X] T094 [P] [US4] [S3] 建立 `AP/src/components/EventDetail/PrevNextNav.tsx`（`pn` 區塊；停用時透明度 .4）
- [X] T095 [US4] [S3] 修改 `AP/src/components/EventDetail/EventDetail.tsx` 與 `AP/src/components/EventDetail/EventDetail.css`（依賴 T091–T094）：依序組合 標題區 → 摘要 → `EventChapters` → `EventPlace` → `EventParticipants`，底部 `PrevNextNav`
- [X] T096 [US4] [S3] 修改 `AP/src/containers/EventDrawerContainer.tsx`（依賴 T089、T090、T095）：`prevNext(id, useFilteredEvents(), dataset.events)`，切換 dispatch `openEvent`；頭像 dispatch `addCharacter`；名字 dispatch `openCharacter`（US5 起顯示角色面板）；地點 dispatch `goToPlace`
- [X] T097 [US4] 於 `AP/` 執行 `npm test`、`npm run typecheck`、`npm run lint`、`npx playwright test e2e/us1-timeline.spec.ts e2e/us2-character-filter.spec.ts e2e/us3-arc-filter.spec.ts e2e/us4-event-detail.spec.ts --project=chrome`，修正至全綠

**Checkpoint**: US1～US4 皆可獨立運作

---

## Phase 7: User Story 5 - 檢視角色資料與狀態 (Priority: P1)

**Goal**: 角色資料面板：身分、1–120 回狀態條與三節點、結局、「只看此角色」、參與事件、人物關係；入口含 chip「i」鈕、事件明細角色名、關係圖節點（US7）。

**Independent Test**: 從 chip「i」或事件明細角色名開啟角色資料，驗證狀態條分段、三節點、非一百單八將、關係切換與「只看此角色」（`AP/e2e/us5-character.spec.ts`、`AP/e2e/us4-prevnext-from-character.spec.ts` 全綠）。

### Tests for User Story 5 ⚠️

- [X] T098 [P] [US5] [S4] 撰寫 `AP/src/domain/status.test.ts`（用 `realDataset`）：`statusAt(c, n)` 依「`fateChapter≠null 且 n≥fateChapter` → 已死亡或離散；否則 `joinChapter≠null 且 n≥joinChapter` → 已上梁山；否則 `n≥firstChapter` → 在野；否則 未登場」（FR-013、D-2）；`statusSegments`：晁蓋 未登場 13／在野 6／已上梁山 40／已死亡或離散 61（AC-P22）、高俅 未登場 1／在野 119（AC-P23）、公孫勝 110–120 為已死亡或離散且最後一段不是已上梁山（AC-S16）；`milestones`：無值者不產生（高俅只有登場 2）；`statusAriaLabel` 產生「未登場 13 回，在野 6 回，已上梁山 40 回，已死亡或離散 61 回」格式；檔頭附 ISP 分割表
- [X] T099 [P] [US5] 修改 `AP/src/state/appReducer.test.ts`：新增 `onlyCharacter`（`selected=[id]` 並關面板，AC-P25、AC-S25）
- [X] T100 [P] [US5] [S4] 撰寫 `AP/src/components/CharacterDetail/CharacterDetail.test.tsx`：依 `contracts/ui-contracts.md`「S4」：內容順序 身分區 → 狀態 → 結局 →「只看此角色」→ 參與事件 → 人物關係；「綽號 <nickname 原字串>」（高俅不顯示）、「<星號>・第 <座次> 位・<天罡｜地煞>」或「非一百單八將」；小標「一百二十回中的狀態」；節點標記「登場 <n>」「上梁山 <n>」「結局 <n>」；狀態條 `role="img"` 與 `aria-label`；刻度 1、30、60、90、120；圖例四狀態名；結局「<fate>（第 <n> 回）」或只有 <fate>；「參與事件（<N>）」每列「<a>–<b>回」或「<n>回」＋事件名；人物關係鈕「<頭像> <姓名> <關係類型>」、`title`＝關係說明；無關係「收錄範圍內沒有此角色的關係資料。」
- [X] T101 [P] [US5] [S1] [S4] 撰寫 `AP/e2e/us5-character.spec.ts`：逐條 AC-12、AC-13、AC-P22、AC-P23、AC-P24、AC-P25、AC-S12（點林沖「i」後林沖 chip `aria-pressed` 不變）、AC-S16、AC-S24（事件明細與角色資料面板各以 Escape 與點遮罩關閉，G-10）、AC-S25（「只看此角色」後角色資料面板關閉、已選只剩魯智深、「共 10 個事件」，G-10）（共 10 條）
- [X] T102 [P] [US5] [S3] [S4] 撰寫 `AP/e2e/us4-prevnext-from-character.spec.ts`：AC-S15（US4 的驗收，需 S4 入口故於本 phase 撰寫）：已選林沖，自宋江角色資料開啟不在篩選結果中的「宋公明神聚蓼兒洼」（全書最後一個事件），「已是最後一個 →」停用；按上一個依全書順序切到「眾將散去」

### Implementation for User Story 5

- [X] T103 [P] [US5] [S4] 實作 `AP/src/domain/status.ts`：`statusAt`、`statusSegments`、`milestones`、`statusAriaLabel`
- [X] T104 [US5] 修改 `AP/src/state/appReducer.ts`：加入 `onlyCharacter`（使用 `selection.only`）
- [X] T105 [P] [US5] [S4] 建立 `AP/src/components/CharacterDetail/CharacterIdentity.tsx`（大頭像＋`h2`＋綽號／星號行）
- [X] T106 [P] [US5] [S4] 建立 `AP/src/components/CharacterDetail/StatusBar.tsx` 與 `AP/src/components/CharacterDetail/StatusBar.css`（標記 → 四色區段 → 刻度 → 圖例，色取 token）
- [X] T107 [P] [US5] [S4] 建立 `AP/src/components/CharacterDetail/CharacterEvents.tsx`（全書順序、點擊 `onOpenEvent`）
- [X] T108 [P] [US5] [S4] 建立 `AP/src/components/CharacterDetail/CharacterRelations.tsx`（點擊 `onOpenCharacter`）
- [X] T109 [US5] [S4] 建立 `AP/src/components/CharacterDetail/CharacterDetail.tsx` 與 `AP/src/components/CharacterDetail/CharacterDetail.css`（依賴 T105–T108）：依序組合 身分 → 狀態 → 結局 →「只看此角色」按鈕 → 參與事件 → 人物關係
- [X] T110 [US5] [S4] 建立 `AP/src/containers/CharacterDrawerContainer.tsx`（依賴 T103、T104、T109）：`Drawer`（`data-page="S4 角色資料面板"`、`aria-label="角色資料"`、`data-testid="character-drawer"`、類別字「角色資料」）；關係取 `dataset` 中含該角色的 `Relation`；「只看此角色」dispatch `onlyCharacter`；事件 dispatch `openEvent`；關係對象 dispatch `openCharacter`
- [X] T111 [US5] 修改 `AP/src/App.tsx`（依賴 T110）：`drawer.kind === 'character'` 時渲染 `CharacterDrawerContainer`
- [X] T112 [US5] [S1] 修改 `AP/src/containers/FilterBarContainer.tsx`：傳 `onInfo` 給 `CharacterChip`，dispatch `openCharacter` 且不改變選取（AC-S12）
- [X] T113 [US5] 於 `AP/` 執行 `npm test`、`npm run typecheck`、`npm run lint`、`npx playwright test e2e/us1-timeline.spec.ts e2e/us2-character-filter.spec.ts e2e/us3-arc-filter.spec.ts e2e/us4-event-detail.spec.ts e2e/us4-prevnext-from-character.spec.ts e2e/us5-character.spec.ts --project=chrome`，修正至全綠

**Checkpoint**: P1 全數（US1～US5）可運作，可作為第一個展示版本

---

## Phase 8: User Story 6 - 地圖檢視事件地點 (Priority: P2)

**Goal**: 北宋疆域示意地圖：篩選結果的地點標記與事件數、單一角色行跡、全圖／山東切換、點標記列事件、無法定位計數、地圖下方章回刻度。

**Independent Test**: 切到地圖視圖，驗證標記與事件數、單一角色行跡、多角色不畫行跡、無法定位提示、全圖／山東切換、點標記列事件與章回刻度位置（`AP/e2e/us6-map.spec.ts` 全綠）。

### Tests for User Story 6 ⚠️

- [X] T114 [P] [US6] [S5] 修改 `AP/src/domain/mapLayout.test.ts`（新增）：`buildMarkers(filtered, places, scope)` 只含篩選結果中、在範圍內的地點與事件數（武松全圖 8、山東 4 不含東京）；半徑 `(山東 12｜全圖 9) + min(事件數, 8)·1.3`；標記推開 40 輪、間距 山東 6／全圖 2，只改顯示位置；標籤靠右、近右緣改靠左，山東未篩選時標籤外框兩兩不相交（AC-P37）；`buildTrail(filtered, characterId)`：`place≠null`、依全書順序、連續同地點合併（G-3、AC-S10）；`unlocatedCount`（武松＋宋江＝1）；檔頭附 ISP 分割表
- [X] T115 [P] [US6] 修改 `AP/src/state/appReducer.test.ts`：新增 `setMapScope`、`focusPlace`
- [X] T116 [P] [US6] [S5] 撰寫 `AP/src/components/MapView/MapView.test.tsx`：依 `contracts/ui-contracts.md`「S5 地圖」：`section[data-page="S5 地圖"]`；地圖欄順序 範圍切換（`role="tablist"`、`aria-label="地圖範圍"`、「全圖」「山東」）→ 地圖框（`data-testid="map"`）→ 刻度＋說明；側欄（`data-testid="map-side"`）地點面板 → 說明面板；SVG `aria-label`「北宋疆域示意地圖」／「山東範圍示意地圖」；山東框「山東 · 點此放大」（`aria-label="放大山東"`，僅全圖）；標記 `aria-label="<地名>，<N> 個事件"`、焦點地點朱色；角落「示意，非精確測繪」／「示意，非精確測繪 · 山東範圍外的地點不顯示」；「<N> 個事件無法標示地點」（N>0）；刻度 `aria-label="章回範圍"` 與說明「章回刻度 · [<大節名>，]第 <a>–<b> 回，共 <N> 個事件，直線標出各事件的起始回」；地點面板三種狀態與「「<地名>」不在目前的篩選結果中。」；說明面板三種文案；結果為 0 時覆蓋 `EmptyState`
- [X] T117 [P] [US6] [S5] 撰寫 `AP/e2e/us6-map.spec.ts`：逐條 AC-14、AC-15、AC-16、AC-P26、AC-P27、AC-P28、AC-P35、AC-P36、AC-P37、AC-P38、AC-P39（刻度在地圖正下方、寬度相同）、AC-S10、AC-S11、AC-S23（先切「山東」再回時間軸開「醉打蔣門神・血濺鴛鴦樓」點「孟州 · 在地圖上看」：範圍自動改「全圖」、`全圖` 分頁 `aria-selected`、孟州標記為焦點色，G-10）（共 14 條），另加「AC-P21（地圖端）」：自事件明細點地點後該地點標記為焦點色、側欄列出該地點

### Implementation for User Story 6

- [X] T118 [P] [US6] [S5] 建立 `AP/src/domain/mapGeometry.ts`：自 Prototype（唯讀 `.specify/context/shuihu-timeline/v2/prototype/index.html`）取出示意底圖折線常數（陸地、海、遼東、黃河、長江）、地名註記座標、梁山泊水域橢圓、山東框（全圖座標）
- [X] T119 [P] [US6] [S5] 修改 `AP/src/domain/mapLayout.ts`：加入 `buildMarkers`、推開演算法、標籤側別、`buildTrail`、`unlocatedCount`
- [X] T120 [US6] 修改 `AP/src/state/appReducer.ts`：加入 `setMapScope`、`focusPlace`
- [X] T121 [P] [US6] [S5] 建立 `AP/src/components/MapView/ScopeSwitch.tsx`
- [X] T122 [P] [US6] [S5] 建立 `AP/src/components/MapView/MapSvg.tsx` 與 `AP/src/components/MapView/MapMarker.tsx`：圖層順序 陸地底 → 海、遼東 → 黃河（全圖另有長江）→ 地名註記 → 梁山泊水域 → 山東框（僅全圖、可點）→ 行跡（紅色虛線、各段中點順序號 1…n，只選一位且 ≥2 點）→ 標記；標記為 `role="button"`＋`tabindex="0"` 的 SVG 群組，Enter／Space 觸發
- [X] T123 [P] [US6] [S5] 建立 `AP/src/components/MapView/MapRuler.tsx`（與地圖同寬的精簡刻度 1、30、60、90、120，直線標出各事件起始回，FR-018）
- [X] T124 [P] [US6] [S5] 建立 `AP/src/components/MapView/MapSidePanel.tsx`（地點面板＋說明面板；點事件 `onOpenEvent`）
- [X] T125 [US6] [S5] 建立 `AP/src/components/MapView/MapView.tsx` 與 `AP/src/components/MapView/MapView.css`（依賴 T121–T124）：`mapgrid` 寬 ≥900px 為「地圖欄｜側欄 280px」、以下單欄；SVG 寬 100% 自動縮放；結果為 0 時以 `EmptyState overlay` 覆蓋地圖框
- [X] T126 [US6] [S5] 建立 `AP/src/containers/MapContainer.tsx`（依賴 T118–T120、T125）：以 `useFilteredEvents`、`mapScope`、`focusPlace` 呼叫 `mapLayout.*`；行跡只在 `selected.length === 1` 時計算；dispatch `setMapScope`、`focusPlace`、`openEvent`、`clearFilters`
- [X] T127 [US6] 修改 `AP/src/App.tsx`（依賴 T126）：`view === 'map'` 改渲染 `MapContainer`，移除 S5 佔位
- [X] T128 [US6] 於 `AP/` 執行 `npm test`、`npm run typecheck`、`npm run lint`、`npx playwright test --project=chrome`（含 us1～us6 全部），修正至全綠

**Checkpoint**: US1～US6 皆可獨立運作

---

## Phase 9: User Story 7 - 角色關係網絡圖 (Priority: P2)

**Goal**: 關係圖：未選角色以宋江為中心、已選角色居中一層展開其餘淡出、大節淡出（D-1／G-9）、圖例只列出現類型與依狀態切換的說明（D-4）、點節點開角色資料、「＋」加入篩選。

**Independent Test**: 切到關係圖，驗證預設以宋江為中心、圖例、已選角色居中一層展開、點節點開資料、「＋」加入篩選、大節淡出與全部淡出空狀態（`AP/e2e/us7-graph.spec.ts` 全綠）。

### Tests for User Story 7 ⚠️

- [ ] T129 [P] [US7] [S6] 撰寫 `AP/src/domain/graphLayout.test.ts`（用 `realDataset`）：固定環序常數（資料中有、環序沒有者依資料順序補在最後）；viewBox 820×720、中心 (410,360)；未選→宋江居中；單一中心放正中、多中心排半徑 `min(40+12n, 130)` 小圈；一層半徑 175（多中心 220）自 −90°+0.2 rad 起、二層 315 自 −90° 起；淡出：未選 0 個、選林沖 19 個（清楚＝林沖、魯智深、高俅）、大節三打祝家莊未選角色時在該大節無事件者淡出（AC-S18）、誤走妖魔・魯智深與林沖＋王英全部淡出（含王英，`allDimmed=true`，AC-S20）；邊只在兩端可見且（未選角色或連到中心）時清楚；圖例類型＝資料出現者依首次出現順序、不含師徒（AC-P40）；圖例說明 未選「點人物看資料，點「＋」加入篩選；未選角色時以宋江為中心」、已選「點人物看資料，點「＋」加入篩選」（D-4）；檔頭附 ISP 分割表
- [ ] T130 [P] [US7] [S6] 撰寫 `AP/src/components/GraphView/GraphView.test.tsx`：依 `contracts/ui-contracts.md`「S6 關係圖」：`section[data-page="S6 關係圖"]` → `data-testid="graph"` 內 SVG（`role="img"`、`aria-label="角色關係圖"`，邊在下、節點在上）→ 圖例列；節點圓 `aria-label="<姓名> 角色資料"`、已選者朱色外框＋`data-selected`；「＋」`aria-label="將 <姓名> 加入篩選"`，已選節點不渲染；淡出節點 `data-dim="true"`；邊 `<title>`「<甲>—<乙>：<類型>。<說明>」；圖例 天罡、地煞、其他＋出現的關係類型；`allDimmed` 時覆蓋 `EmptyState`；節點群組 Enter／Space 觸發
- [ ] T131 [P] [US7] [S6] 撰寫 `AP/e2e/us7-graph.spec.ts`：逐條 AC-17、AC-18、AC-P29、AC-P30、AC-P31、AC-P32、AC-P40、AC-S18（淡出且結果數與時間軸一致）、AC-S20、AC-S22

### Implementation for User Story 7

- [ ] T132 [P] [US7] [S6] 實作 `AP/src/domain/graphLayout.ts`：常數 `GW=820`、`GH=720`、半徑 175／220／315、節點半徑 22、「＋」半徑 9、淡出透明度 `.12`（research「版面常數」）、環序常數；`layoutGraph(dataset, selected, arcCharacters)` 回傳節點座標與 `dim`、邊可見性、`allDimmed`；`legendTypes`、`legendCaption(hasSelected)`
- [ ] T133 [P] [US7] [S6] 建立 `AP/src/components/GraphView/GraphNode.tsx` 與 `AP/src/components/GraphView/GraphEdge.tsx`：節點色依星號群組 token、邊樣式依關係類型（research「關係線樣式」）；節點位移 CSS transition（`transform .5s, opacity .3s`）
- [ ] T134 [P] [US7] [S6] 建立 `AP/src/components/GraphView/GraphLegend.tsx`
- [ ] T135 [US7] [S6] 建立 `AP/src/components/GraphView/GraphSvg.tsx`、`AP/src/components/GraphView/GraphView.tsx`、`AP/src/components/GraphView/GraphView.css`（依賴 T133、T134）：SVG 寬 100% 自動縮放；`prefers-reduced-motion` 時關閉 transition；`allDimmed` 時 `EmptyState overlay`
- [ ] T136 [US7] [S6] 建立 `AP/src/containers/GraphContainer.tsx`（依賴 T132、T135）：已選大節時以 `charactersInArc(dataset.events, arcId)` 傳入；點節點 dispatch `openCharacter`；「＋」dispatch `addCharacter`；空狀態「清除篩選」dispatch `clearFilters`
- [ ] T137 [US7] 修改 `AP/src/App.tsx`（依賴 T136）：`view === 'graph'` 改渲染 `GraphContainer`，移除 S6 佔位
- [ ] T138 [US7] 於 `AP/` 執行 `npm test`、`npm run typecheck`、`npm run lint`、`npx playwright test --project=chrome`，修正至全綠

**Checkpoint**: 全部 user story 可獨立運作

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Prototype 並列比對（SC-003）、窄螢幕與跨瀏覽器（SC-004）、展示情境（SC-002）、AC 涵蓋核對與 quickstart 驗證

- [ ] T139 [P] [S1] [S2] [S3] [S4] [S5] [S6] 建立 `AP/e2e/fixtures/prototypeStates.ts`：依 `contracts/ui-contracts.md`「21 個狀態的重現步驟與 DOM 斷言」逐列定義 21 個狀態（名稱與順序同 `handoff-notes.md`「截圖索引」）：`file`（截圖檔名）、`steps`（只用 UI 操作，從新頁 `/#timeline` 開始）、`blocks`（要檢查順序的 `data-page`）、`texts`（必含文案）、`asserts`（結果數、已選標籤、`aria-pressed`／`aria-selected`、`data-dim` 數等）
- [ ] T140 [S1] [S2] [S3] [S4] [S5] [S6] 建立 `AP/e2e/prototype-compare.spec.ts`（依賴 T139）：Chrome 1440×900、`colorScheme: 'light'`；每狀態開新頁 → 執行步驟 → 等動畫結束 → `fullPage` 截圖至 `AP/test-results/compare/<檔名>.png`；DOM 斷言：① 各 `data-page` 區塊直接子區塊依 ui-contracts 順序 ② 必含文案以 `normalizeText` 比對 `innerText` ③ 狀態斷言；#20、#21 圖例說明依 D-4 斷言新文案（並列目視時不計逐字一致，SC-003）
- [ ] T141 [P] 建立 `AP/e2e/responsive.spec.ts`：AC-S6（400×800 依序切地圖、關係圖並開事件明細與角色資料：頁面無水平捲動、兩種面板為全寬底部抽屜、地圖與關係圖寬度不超出視窗）；SC-004（1440×900 與 400×800 下三個視圖與兩種面板 `hasNoHorizontalScroll`）
- [ ] T142 [P] 建立 `AP/e2e/demo-scenario.spec.ts`：SC-002 展示情境 6 步在同一頁面依序完成不重新整理（進站「共 54 個事件」→ 搜尋「豹子頭」Enter 選林沖 → 開「大鬧野豬林」點魯智深頭像 → 點林沖名字看狀態條 →「只看此角色」切地圖看行跡 → 切關係圖點節點開資料），測試標題含 `@demo` 供 `npm run e2e:browsers` 在 WebKit／Firefox／Edge 抽驗；另以 `test.use({ viewport: { width: 400, height: 800 } })` 在 400×800 再跑一次同樣 6 步（SC-004「操作可完成」）
- [ ] T143 [P] 建立 `AP/scripts/check-ac-coverage.mjs`：掃描 `AP/e2e/*.spec.ts` 的測試名稱，核對 AC-01～AC-18、AC-P1～AC-P42、AC-S1～AC-S27 共 87 個編號全部出現，缺漏列出並非零結束；於 `AP/` 以 `node scripts/check-ac-coverage.mjs` 執行並補齊缺漏
- [ ] T144 於 `AP/` 執行 `npm run typecheck`、`npm run lint`（含分層與 FR-021 import 限制）、`npm test`、`npm run build`，修正所有錯誤；確認 `AP/dist/data/*.json` 存在、`AP/dist/index.html` 含 CSP meta
- [ ] T145 [P] 檢查機密與輸出安全（§CP-2、§FE-3／§FE-5）：`AP/.env.example` 只含非機密變數、`AP/src/**` 無 `dangerouslySetInnerHTML`、無寫死的部署路徑或資料 URL（皆經 `AP/src/config.ts`）；網站沒有任何登入、隱藏或防劇透機制（事件、結局、星號直接顯示，FR-023）
- [ ] T146 依 `specs/001-shuihu-timeline-poc/quickstart.md` 全程驗證：`npm ci` → `npm run data:convert`（重跑結果與已 commit 的 `AP/public/data/*.json` 無差異）→ `npm run dev` 手動走展示情境 6 步 → `npm test` → `npm run build`／`npm run preview` → `npm run e2e` → `npm run e2e:compare`（輸出 21 張截圖到 `AP/test-results/compare/`，供人與 `.specify/context/shuihu-timeline/v2/prototype/screens/` 同名原圖並列目視 SC-003）→ `npm run e2e:browsers`（WebKit／Firefox／Edge）；quickstart 與實際不符處回報（不改 quickstart.md）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup（Phase 1）**：無依賴；T001 先做，T002–T008 可並行，T009 需 T001
- **Foundational（Phase 2）**：依賴 Setup；阻擋所有 user story
- **US1（Phase 3）**：依賴 Foundational；MVP
- **US2（Phase 4）**：依賴 US1（FilterBar 殼、TimelineContainer、EventCard 的 `selectedIds`）
- **US3（Phase 5）**：依賴 US1（ArcBands／TimelineList 的 `onSelectArc`）與 US2（FilterBar row 插槽、`clearFilters`）
- **US4（Phase 6）**：依賴 US1（EventDrawerContainer、EventDetail 最小版）與 US2（`addCharacter`）
- **US5（Phase 7）**：依賴 US2（`selection.only`、CharacterChip `onInfo`）與 US4（事件明細角色名入口、AC-S15 的上一個／下一個）
- **US6（Phase 8）**：依賴 Foundational 的 `mapLayout` 範圍部分、US4 的 `goToPlace`（AC-P21 地圖端）
- **US7（Phase 9）**：依賴 US5（點節點開角色資料）與 US2（`addCharacter`、`clearFilters`）
- **Polish（Phase 10）**：依賴全部 story

### Story 完成順序

```text
Setup → Foundational → US1 → US2 → US3 → US4 → US5 → US6 → US7 → Polish
```

US6 的功能相依只到 US4，理論上可與 US5 並行；但兩者都修改 `App.tsx`、`appReducer.ts`、`appReducer.test.ts`，並行時須把這三個檔的修改序列化。預設照上列順序執行。

### Within Each Story

- 測試（domain 單元 → 元件 → E2E）先寫並確認失敗
- domain 純函式 → reducer → 展示元件 → 容器 → `App.tsx` 接線 → 執行驗證
- `appReducer.ts`／`appReducer.test.ts`、`App.tsx`、`FilterBar.tsx`、`FilterBarContainer.tsx`、`TimelineContainer.tsx` 同一 phase 內只有一個任務修改，不與他任務並行改同檔

### 跨 story 共用熱點檔（多個 phase 修改，需序列化）

| 檔案 | 修改的 phase（任務） |
| :---- | :---- |
| `AP/src/state/appReducer.ts` | Foundational T028、US2 T067、US3 T079、US4 T090、US5 T104、US6 T120 |
| `AP/src/state/appReducer.test.ts` | Foundational T024、US2 T062、US3 T076、US4 T086、US5 T099、US6 T115 |
| `AP/src/App.tsx` | Foundational T037、US1 T058、US5 T111、US6 T127、US7 T137 |
| `AP/src/containers/FilterBarContainer.tsx` | US1 T056、US2 T073、US3 T082、US5 T112 |
| `AP/src/components/FilterBar/FilterBar.tsx` | US1 T053、US2 T072、US3 T081（`FilterBar.css`：US1 T053、US2 T072） |
| `AP/src/containers/TimelineContainer.tsx` | US1 T055、US2 T074、US3 T083 |
| `AP/src/components/EventDetail/EventDetail.tsx`（＋`.css`） | US1 T054、US4 T095 |
| `AP/src/containers/EventDrawerContainer.tsx` | US1 T057、US4 T096 |
| `AP/src/domain/mapLayout.ts`（＋`.test.ts`） | Foundational T023／T027、US6 T114／T119 |
| `AP/src/state/AppStateProvider.tsx` | Foundational T029、US1 T046 |

---

## Parallel Example: Foundational

```text
# 第一波（T010–T014、T018 可同時）：
T010 types.ts ｜ T011 config.ts ｜ T012 tokens.css ｜ T013 base.css ｜ T014 validateDataset.test.ts ｜ T018 loadDataset.test.ts
# 序列：T015 → T016 → T017 → T019 → T020
# 第二波（T020 後）：T021–T024 測試並行 → T025–T028 實作並行；同時 T030、T033–T036、T038
```

## Parallel Example: User Story 1

```text
# 測試並行：T039 timelineLayout.test.ts ｜ T040 useHashView.test.ts ｜ T041 Timeline.test.tsx ｜ T042 FilterBar.test.tsx ｜ T043 us1-timeline.spec.ts
# 實作第一波：T044 ｜ T045 ｜ T047 ｜ T048 ｜ T049 ｜ T053 ｜ T054
# 實作第二波：T046 ｜ T050 ｜ T051 → T052 → T055、T056、T057（三個容器不同檔可並行）→ T058 → T059
```

## Parallel Example: User Story 2

```text
# 測試並行：T060 ｜ T061 ｜ T062 ｜ T063 ｜ T064
# 實作：T065 ｜ T066 ｜ T068 ｜ T069 ｜ T070 ｜ T071 並行 → T067、T072 → T073、T074 → T075
```

## Parallel Example: User Story 3

```text
# 測試並行：T076 ｜ T077 ｜ T078 → 實作：T079 ｜ T080 並行 → T081 → T082、T083 → T084
```

## Parallel Example: User Story 4

```text
# 測試並行：T085 ｜ T086 ｜ T087 ｜ T088
# 實作：T089 ｜ T091 ｜ T092 ｜ T093 ｜ T094 並行，T090 → T095 → T096 → T097
```

## Parallel Example: User Story 5

```text
# 測試並行：T098 ｜ T099 ｜ T100 ｜ T101 ｜ T102
# 實作：T103 ｜ T105 ｜ T106 ｜ T107 ｜ T108 並行，T104 → T109 → T110 → T111、T112 → T113
```

## Parallel Example: User Story 6

```text
# 測試並行：T114 ｜ T115 ｜ T116 ｜ T117
# 實作：T118 ｜ T119 ｜ T121 ｜ T122 ｜ T123 ｜ T124 並行，T120 → T125 → T126 → T127 → T128
```

## Parallel Example: User Story 7

```text
# 測試並行：T129 ｜ T130 ｜ T131
# 實作：T132 ｜ T133 ｜ T134 並行 → T135 → T136 → T137 → T138
```

---

## Implementation Strategy

### MVP First（只做 US1）

1. Phase 1 Setup → Phase 2 Foundational（含資料轉換）
2. Phase 3 US1 → **停下驗證**：`e2e/us1-timeline.spec.ts` 全綠，可展示全書時間軸與事件明細標題

### Incremental Delivery

1. US2（角色篩選）→ US3（大節）→ US4（事件明細完整）→ US5（角色資料）：P1 全數完成即第一個展示版本
2. US6（地圖）→ US7（關係圖）：P2
3. Polish：並列比對、窄螢幕／跨瀏覽器、展示情境、AC 涵蓋核對、quickstart

### AC → E2E 對應（87 條）

| 檔案 | AC |
| :---- | :---- |
| `AP/e2e/us1-timeline.spec.ts` | AC-01、AC-02、AC-P1、AC-P2、AC-P41、AC-P42、AC-S1～S5、AC-S17（12） |
| `AP/e2e/responsive.spec.ts` | AC-S6（US1，需地圖／關係圖／兩種面板）（1） |
| `AP/e2e/us2-character-filter.spec.ts` | AC-03～07、AC-P3～P12、AC-P33、AC-P34、AC-S7～S9、AC-S19、AC-S21（22） |
| `AP/e2e/us3-arc-filter.spec.ts` | AC-08、AC-09、AC-P15～P17、AC-S14；AC-P13、AC-P14（US2，需大節選單）；AC-S13（US1，需大節選單）（9） |
| `AP/e2e/us4-event-detail.spec.ts` | AC-10、AC-11、AC-P18～P21、AC-S26、AC-S27（8） |
| `AP/e2e/us4-prevnext-from-character.spec.ts` | AC-S15（US4，需 S4 入口）（1） |
| `AP/e2e/us5-character.spec.ts` | AC-12、AC-13、AC-P22～P25、AC-S12、AC-S16、AC-S24、AC-S25（10） |
| `AP/e2e/us6-map.spec.ts` | AC-14～16、AC-P26～P28、AC-P35～P39、AC-S10、AC-S11、AC-S23（14；另補 AC-P21 地圖端） |
| `AP/e2e/us7-graph.spec.ts` | AC-17、AC-18、AC-P29～P32、AC-P40、AC-S18、AC-S20、AC-S22（10） |

---

## Notes

- `[P]` = 不同檔案、與同組任務無相依；同一 phase 內修改同一檔的任務一律不標 `[P]`
- 每個任務完成後執行對應測試；每個 story 走一個 PR（§CP-5），PR 連結本 spec；Setup、Foundational、Polish 三個非 story phase 也各自一個 PR
- 測試名稱帶 AC 編號；單元測試檔頭附 ISP 分割表（§CP-4、§TR-7）
- 實作必須保留 ui-contracts 列出的 `data-page` 值與 `data-testid`，供 E2E 與 compare 定位
- 不修改 `.specify/context/`（Prototype 只讀）、spec.md 與 plan 產物
