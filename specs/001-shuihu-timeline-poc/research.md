# Research: 水滸傳角色事件時間軸（一頁式前端 POC）

**Feature**: `001-shuihu-timeline-poc` | **Date**: 2026-10-29 | **Plan**: [plan.md](./plan.md)

Technical Context 沒有留下 NEEDS CLARIFICATION：技術選型已由使用者確認，其餘未定項目在本檔逐條決定。
取證方式：Prototype 以本機 `python3 -m http.server` 開啟、用 Playwright（Chrome，1440×900）操作與讀取 computed style／`innerText`；來源包檔案未改動。

## 技術決策

### R1 框架與建置

- **Decision**: React 19 + TypeScript，Vite 8 建置純靜態 SPA，全部放 `AP/`。
- **Rationale**: 使用者指定；一頁式、無 SSR 需求，Vite 產出 `dist/` 可直接放 GitHub Pages。
- **Alternatives considered**: Vue 3 + Nuxt 3（tech-standards 建議；偏離理由見 plan「偏離紀錄」）；Next.js（SSR／路由用不到）。

### R2 狀態管理

- **Decision**: 一個 `AppStateProvider`（Context + useReducer），reducer 只呼叫 `domain/` 純函式；篩選結果以 selector 即時計算，不存 state。資料（Dataset）放另一個 `DatasetProvider`，與 UI 狀態分開。
- **Rationale**: 狀態量小（已選角色、大節、搜尋字、視圖、地圖範圍、焦點地點、面板）；純函式 reducer 好測（§CP-4）。
- **Alternatives considered**: Zustand／Redux Toolkit（多一個相依，無實益）；每個視圖各自 useState（違反「三視圖共用篩選」FR-004）。

### R3 視圖路由

- **Decision**: 不引入路由套件；`useHashView` 讀寫 `location.hash`（`replaceState`），無效 hash 落到 `timeline`。
- **Rationale**: 只有三個視圖且篩選不進網址（FR-005）；Prototype 也是 `replaceState`。
- **Alternatives considered**: react-router HashRouter（為三個值引入整套路由，過重）。

### R4 地圖與關係圖

- **Decision**: 手寫 SVG；地圖用 Prototype 的兩個固定範圍與等距投影、底圖折線常數（`mapGeometry.ts`）、標記推開演算法；關係圖用 Prototype 的固定環序與三圈半徑。版面計算全部在 `domain/mapLayout.ts`、`domain/graphLayout.ts`，元件只畫。
- **Rationale**: 範圍外已排除自由縮放與真實底圖（spec Assumptions）；固定排版才能逐張對上 Prototype 截圖（SC-003）；純函式可單元測試標籤不重疊、行跡合併等規則。
- **Alternatives considered**: Leaflet／MapLibre（需真實底圖，範圍外）；D3-force（佈局不固定，無法對截圖）；Cytoscape（多相依，樣式難對齊 token）。

### R5 資料與資料存取層

- **Decision**: 6 個實體各一個 JSON（`AP/public/data/`），由 `scripts/convert-prototype-data.mjs` 自 Prototype 內嵌 `const DATA = {...}` 一次性轉出並正規化（見 data-model.md）；執行期只經 `loadDataset` → `validateDataset` → `buildIndex`。
- **Rationale**: 符合 `[HO Q2]`／FR-021；分檔便於日後維護單一實體；驗證失敗視同載入失敗，避免顯示部分資料（FR-022）。
- **Alternatives considered**: 單一大 JSON（可行，但維護時 diff 難讀）；把資料 import 進 bundle（違反 FR-021「不直接內嵌資料」）。

### R6 測試

- **Decision**: Vitest（jsdom）+ RTL 測 `domain/`、`data/`、`state/` 與主要展示元件；Playwright（Chrome channel）測 AC／AC-P／AC-S 與 Prototype 並列比對；Safari／Edge／Firefox 最新版（D-6）以 SC-004 的展示情境 6 步抽驗（Playwright webkit／firefox project 與 `channel: 'msedge'` 的 msedge project，手動觸發）。
- **Rationale**: 對應 §CP-4、§TR-7（Experimental：主要流程範圍、Base Choice）；E2E 直接把 AC 數字（8、14、13/6/40/61、15 地點…）當 oracle。
- **Alternatives considered**: Cypress（團隊 E2E 已用 Playwright，且 Prototype 取證同工具）；視覺像素 diff（SC-003 明定色彩與像素位移不計，改用 DOM 斷言＋人工並列）。

### R7 環境設定（§CP-3）

- **Decision**: `VITE_BASE_PATH`（Vite `base`，GitHub Pages 子路徑，預設 `/`）、`VITE_DATA_BASE_URL`（資料位置，預設 `${BASE_URL}data/`）；環境別用 Vite mode。`.env.example` 只列名稱與用途。
- **Rationale**: 部署路徑因環境而異，不得寫死；兩者皆非機密。
- **Alternatives considered**: 寫死相對路徑（換部署子路徑就壞）。

### R8 字型

- **Decision**: 沿用 Prototype 的 Google Fonts（LXGW WenKai TC 400/700、Noto Sans TC 400/500/700，`display=swap`），並保留系統字型 fallback。
- **Rationale**: `[HO Q7]` 允許網路字型失敗退回系統字型。
- **Alternatives considered**: 自架字型（中文字型檔大，POC 不值得）。

### R9 Prototype 取證與發現

- Prototype 的篩選、狀態推算、地圖、關係圖邏輯已以 Playwright 操作與限量檢視 `<script>` 片段確認，與 spec 的 AC 數字一致（武松 8 事件、武松＋魯智深 14、晁蓋 13/6/40/61、高俅 1/119、山東範圍 15 地點、還道村無座標、林沖＋魯智深「大鬧野豬林」下一個為「棒打洪教頭」）。
- 發現兩處 Prototype 與 spec／StoryBoard 不一致，已回填 spec 偏離登記：D-4（關係圖圖例說明文字只在第一次畫圖時決定；S6-02、S6-03 截圖都受影響）、D-5（搜尋比對整段綽號字串，含「座次綽號」說明字）。

## 設計 token

**模式 B**（自 Prototype 導入）。數值以 computed style 為準（Chrome，1440×900，淺色與 `prefers-color-scheme: dark` 各量一次）；token 採**混合命名**（plan review 裁決 2026-10-29，對應 spec 權威劃分第 4 條「命名沿用 Prototype」）：Prototype `:root` 有原名者（色彩 21 個、陰影 1 個、字型 2 個，共 24 個）一律沿用原名；Prototype 沒有原名者（「師徒」關係色、遮罩、字級、間距、圓角、尺寸）依用途命名。「用途」欄保留原本的語意說明。
實作放 `AP/src/styles/tokens.css`：淺色值寫在 `:root`，深色值寫在 `@media (prefers-color-scheme: dark) { :root { … } }`（G-5）。

### 色彩

| Token | 用途 | 淺色 | 深色 | Prototype 名 |
| :---- | :---- | :---- | :---- | :---- |
| `--paper` | 頁面底色；實心底上的文字（頭像字、已選分頁字） | `#eceee8` | `#14181b` | `--paper` |
| `--paper-2` | 篩選列底、大節色帶交替、次要按鈕底、地圖陸地 | `#e1e5dd` | `#1b2125` | `--paper-2` |
| `--card` | 卡片、面板、輸入框、地圖／關係圖框 | `#f7f8f4` | `#20272b` | `--card` |
| `--ink` | 主要文字；實心按鈕底、已選分頁底、已選標籤底 | `#1c2227` | `#e3e6df` | `--ink` |
| `--ink-2` | 次要文字、刻度、提示 | `#55605f` | `#a1aaa6` | `--ink-2` |
| `--line` | 分隔線與框線 | `#c3cbc2` | `#343d41` | `--line` |
| `--accent` | 連結、結果數字、事件色條、地圖標記、河流 | `#2c5a86` | `#86afd8` | `--accent` |
| `--accent-soft` | 已選 chip 底、海 | `#d5e0ea` | `#25384a` | `--accent-soft` |
| `--seal` | 朱色：印章、已選頭像外框、行跡、山東框、高亮地點、已選節點外框 | `#a8382a` | `#e07563` | `--seal` |
| `--g-tg` | 天罡頭像／節點 | `#2c5a86` | `#86afd8` | `--g-tg` |
| `--g-ds` | 地煞頭像／節點 | `#3f7550` | `#86bc95` | `--g-ds` |
| `--g-ot` | 非一百單八將頭像／節點 | `#86683f` | `#c9a97c` | `--g-ot` |
| `--st-none` | 狀態條「未登場」、精簡刻度底 | `#d5dad2` | `#2b3236` | `--st-none` |
| `--st-wild` | 狀態條「在野」 | `#c4943d` | `#d6a95a` | `--st-wild` |
| `--st-liang` | 狀態條「已上梁山」 | `#2c5a86` | `#86afd8` | `--st-liang` |
| `--st-gone` | 狀態條「已死亡或離散」 | `#5b6164` | `#8a9195` | `--st-gone` |
| `--r-jie` | 關係「結義」 | `#2c5a86` | `#86afd8` | `--r-jie` |
| `--r-zhu` | 關係「主僕」 | `#3f7550` | `#86bc95` | `--r-zhu` |
| `--r-xd` | 關係「兄弟」 | `#86683f` | `#c9a97c` | `--r-xd` |
| `--r-fq` | 關係「夫妻」 | `#a2557a` | `#d38fb0` | `--r-fq` |
| `--r-ch` | 關係「仇敵」 | `#a8382a` | `#e07563` | `--r-ch` |
| `--color-rel-mentor` | 關係「師徒」（本資料未出現，保留） | 同 `--ink-2` | 同左 | （`.e-師徒` 用 `--ink-2`） |
| `--color-scrim` | 面板遮罩 | `rgb(10 14 16 / .28)` | 同左 | （行內） |

### 關係線樣式

| 類型 | 色 | 線寬 | dasharray |
| :---- | :---- | :---- | :---- |
| 結義 | `--r-jie` | 預設 | 實線 |
| 主僕 | `--r-zhu` | 預設 | `7 4` |
| 兄弟 | `--r-xd` | 4 | 實線 |
| 夫妻 | `--r-fq` | 預設 | `2 4`（圓端點） |
| 仇敵 | `--r-ch` | 預設 | `10 4 2 4` |
| 師徒 | `--color-rel-mentor` | 預設 | 實線 |

### 字型與字級

| Token | 值 | 用在 |
| :---- | :---- | :---- |
| `--f-display`（Prototype 原名） | `"LXGW WenKai TC","Kaiti TC","BiauKai","STKaiti","KaiTi",serif` | 標題、事件名、大節名、頭像字、結果數、回目 |
| `--f-ui`（Prototype 原名） | `"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif` | 其餘介面 |
| `--text-3xs` | 10.5px | 狀態條刻度（精簡刻度 10px） |
| `--text-2xs` | 11px | 刻度數字、+N、狀態節點標、地圖註記、事件數字 |
| `--text-xs` | 11.5px | 事件卡章回、chip 綽號 |
| `--text-sm` | 12px | 面板小標、提示、已選標籤列標題、圖例、地圖標籤 |
| `--text-md` | 13px | 快選鈕、已選標籤、上一個／下一個、人物關係鈕、副標、關係圖節點名 |
| `--text-base` | 14px | chip 姓名、分頁、大節名、實心按鈕、地點按鈕 |
| `--text-body` | 15px | 內文（line-height 1.55）、事件名、回目、參與事件 |
| `--text-lg` | 18px | 「共 N 個事件」、關係圖頭像字 |
| `--text-xl` | 20px | 空狀態標題 |
| `--text-2xl` | 22px | 結果數字（粗體） |
| `--text-3xl` | 28px | 面板標題（粗體，line-height 1.2） |
| `--text-display` | `clamp(28px, 4vw, 40px)` | 站名（粗體，字距 .06em） |
| `--weight-regular`／`--weight-medium`／`--weight-bold` | 400／500／700 | 面板小標用 500 |
| `--tracking-wide` | .1em～.12em | 面板頁首、面板小標 |

### 間距

| Token | 值 | 主要用途 |
| :---- | :---- | :---- |
| `--space-1` | 2px | 事件卡內距、清單間距 |
| `--space-2` | 4px | 回目間距、刻度標籤 |
| `--space-3` | 6px | chip 間距、已選標籤間距 |
| `--space-4` | 8px | 列間距、上一個／下一個間距、篩選列 gap |
| `--space-5` | 10px | 人物列、分頁群組 |
| `--space-6` | 12px | 面板頁首上下、側欄卡片內距 |
| `--space-7` | 14px | 實心按鈕左右、側欄卡片左右 |
| `--space-8` | 16px | 頁面左右 gutter、地圖格線 gap |
| `--space-9` | 18px | 面板內距與區塊間距 |
| `--space-10` | 22px | 站名區上方 |
| `--space-12` | 48px | 空狀態上下 |

### 圓角、陰影、尺寸

| Token | 值 | 用途 |
| :---- | :---- | :---- |
| `--radius-xs` | 3px | 狀態條、徽章、關係類型標 |
| `--radius-sm` | 4px | 印章、清單列 hover |
| `--radius-md` | 6px | 輸入框、選單、事件卡、按鈕 |
| `--radius-lg` | 8px | 分頁群組、時間軸／地圖／關係圖框、側欄卡片 |
| `--radius-xl` | 14px | 底部抽屜上緣 |
| `--radius-pill` | 999px | chip、快選鈕、已選標籤、關係鈕 |
| `--shadow` | 淺 `0 10px 30px rgb(28 34 39 / .14)`／深 `0 10px 30px rgb(0 0 0 / .45)` | 面板、事件卡 hover |
| `--size-avatar-sm`／`-md`／`-lg`／`-xl` | 20／26／32／56px | 事件卡／chip／事件面板人物／角色面板 |
| `--size-drawer` | `min(440px, 100%)` | 側邊面板寬 |
| `--size-drawer-sheet` | 82% | 窄螢幕底部抽屜高 |
| `--size-map-side` | 280px | 地圖側欄寬 |
| `--size-page-max` | 1440px | 內容最大寬 |
| `--bp-sheet` | 720px | 面板改底部抽屜、時間軸改直向、chip 橫捲 |
| `--bp-map-stack` | 900px | 地圖側欄移到下方 |

### 版面常數（非 CSS token，放 `domain/` 常數）

時間軸 `UNIT_MIN=30`、`CARD_MIN=170`、`LANE_H=70`、`LANE_GAP=8`；地圖範圍與半徑見 plan「地圖」；關係圖 `GW=820`、`GH=720`、半徑 175／220／315、節點半徑 22、「＋」半徑 9；淡出透明度 `.12`；過場 `transform .5s, opacity .3s`，`prefers-reduced-motion: reduce` 時關閉。
