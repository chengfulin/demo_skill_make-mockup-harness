# make-mockup-harness ＋ sdd-harness 範例：水滸傳角色事件時間軸

這個 repo 是兩個 skill 串接使用的範例，記錄一個需求從頭走到可互動 Mockup、交接給開發，再以規格驅動開發（SDD）做出可執行 POC 的完整過程：

- **make-mockup-harness**：需求討論 → Story Board → 互動 Mockup → 一致性檢核 → 交接包。
- **sdd-harness**：以交接包為上游來源，跑 spec-kit 全流程（憲章 → 規格 → 釐清 → 計畫 → 任務 → 一致性分析 → 實作），產出 [`AP/`](AP/) 的前端 POC。

這個 repo 用來說明兩個 skill 各自適合的情境、怎麼銜接，也方便分享給別人參考。

範例主題是一個粉絲向單頁網站。它把《水滸傳》（百二十回本）的 22 位角色、54 個事件依章回排成時間軸，另外提供地圖與角色關係圖兩種視圖。

## 操作流程影片

[`screen_recording_highlight_bgm.mp4`](screen_recording_highlight_bgm.mp4) 是實際操作的剪輯，從提出需求、產出 Story Board、做 Mockup、一致性檢核，一路錄到升版。

## make-mockup-harness 的流程

```
需求討論 ─► Story Board ─► Design Brief ─► 互動 Mockup（artifact）─► 凍結版本
                ▲                                                       │
                │                                                       ▼
                └──────────── 回饋回寫升版 ◄──────────── 一致性檢核與裁決
                                                                        │
                                                       定稿 ─► SDD 交接包（給 sdd-harness）
```

每個階段都有自己的 commit，對照 git log 就能看出流程怎麼一步步走：

| 階段 | commit |
|---|---|
| Story Board 初版與更正 | `storyboard(shuihu-timeline): 初版 [v1]`、`v1 更正收錄數量與高俅狀態規則` |
| v1 Design Brief → 凍結 Mockup → 一致性檢核 | `brief: v1 design brief`、`mockup: freeze v1`、`review: v1 consistency` |
| 依裁決升版 Story Board | `storyboard: v2 搜尋 Enter、地圖山東切換、關係圖預設中心與圖例、網址記住視圖` |
| v2 Design Brief → 凍結 Mockup → 一致性檢核 | `brief: v2 design brief`、`mockup: freeze v2`、`review: v2 consistency` |
| 交接 SDD | `handoff(shuihu-timeline): v2 SDD 交接包` |

## sdd-harness 的流程

交接包放進 `.specify/context/` 後，由 sdd-harness 接手。每個階段完成後才 commit，釐清、影響分析、實作、驗收、審查由獨立 subagent 把關；spec 與 plan 每次建立或更新後，都要經過人為 review（功能導覽簡報）才能往下走。

```
初始化 ─► 憲章 ─► 規格 ─► 釐清 ─► 計畫 ─► 任務 ─► 一致性分析 ─► 實作（並行波次）─► 開發回寫
          (基線)   ▲ 人為 review  ▲ 人為 review     ▲ 人為 review     validator＋reviewer      handback-to-sa.md
```

| 階段 | commit |
|---|---|
| 初始化、憲章 | `chore(sdd): 初始化 spec-kit 專案`、`docs(sdd): 制定專案憲章（constitution）` |
| 上游來源 | `docs(context): 新增 shuihu-timeline v2 規格來源（StoryBoard＋Prototype）` |
| 規格 → 釐清 → 計畫 → 任務 → 一致性分析 | `docs(sdd): 建立功能規格（specify）` …… `docs(sdd): 一致性分析修正（analyze）` |
| 並行規劃 | `chore(sdd): 完成並行規劃（001）` |
| 實作 | `feat(sdd): 實作波次 1（001）` ～ `實作波次 19（001）`、`feat(sdd): 完成功能實作（implement）` |

幾個值得一看的數字（記在 `.sdd-workflow.json`）：

- 釐清階段 clarifier 提出 13 項發現；一致性分析 19 項發現，修正 17 項。
- 146 個任務、7 個 User Story，以 19 個波次完成。
- 並行規劃腳本原本判定走依序模式（新專案、估計加速只有 1.3×）。這裡為了驗證 sdd-harness 的並行波次流程，指定改走並行模式。
- 實作中發現的 Story Board／Prototype 偏離與缺口，整理在 [`handback-to-sa.md`](specs/001-shuihu-timeline-poc/handback-to-sa.md)，作為下一版 Story Board 的回饋來源。

## 執行 POC

需要 Node.js 24 LTS。所有指令都在 `AP/` 下執行：

```bash
cd AP
npm ci
npm run dev        # http://localhost:5173/#timeline
npm test           # 單元與元件測試（Vitest）
npm run e2e        # 端對端測試（Playwright，Chrome）
```

其他指令見 [`quickstart.md`](specs/001-shuihu-timeline-poc/quickstart.md)。

## 目錄結構

```
.make-mockup.json                     # 工作區設定（mockup 根目錄）
make-mockups/shuihu-timeline/
├── .mockup-workflow.json             # 流程狀態：目前版本、階段、各版 artifact 與 sha256
├── storyboard.md                     # Story Board（最新版，US-01 ～ US-07）
├── revisions.md                      # 版本對照表：回饋來源 ↔ 受影響 US／畫面 ↔ brief／mockup／檢核
├── briefs/                           # 各版 Design Brief 與經查證的假資料
├── mockup-src/index.html             # Mockup 工作原始檔（artifact 的來源）
├── mockups/v1、v2/                    # 凍結的互動 Mockup，commit 後不再修改
├── reviews/                          # 各版 Story Board 與 Mockup 的一致性檢核報告
├── feedback/                         # 回饋原文（如製作備註）
└── handoff/v2/                       # 交給開發的中性交接包，從 index.md 開始讀

.specify/                             # spec-kit 專案設定（sdd-harness 產生）
├── memory/                           # 專案憲章、憲章基線快照、sdd-adoption.json
└── context/shuihu-timeline/v2/       # 上游來源包：交接包複本（StoryBoard＋Prototype），spec 以錨點指回這裡
specs/001-shuihu-timeline-poc/
├── .sdd-workflow.json                # SDD 流程狀態：各階段旗標、並行規劃統計、波次進度
├── spec.md                           # 功能規格（唯一權威），含偏離登記 D-n 與來源缺口 G-n
├── plan.md、research.md、data-model.md、contracts/、quickstart.md
├── tasks.md                          # 146 個任務，依 User Story 分 phase
├── parallel-plan.json                # task 粒度的並行規劃（寫入／讀取集合、相依、波次）
├── brief/feature-brief.html          # 人為 review 閘門用的功能導覽簡報
└── handback-to-sa.md                 # 開發回寫：偏離、決策與缺口，交還 SA 升版 Story Board
AP/                                   # SDD 實作產出：React＋TypeScript 單頁 POC（Vite、Vitest、Playwright）
```

## 範例內容一覽

**User Story**

| 編號 | 名稱 |
|---|---|
| US-01 | 瀏覽全書時間軸 |
| US-02 | 選擇角色篩選事件 |
| US-03 | 依大節篩選 |
| US-04 | 檢視事件明細 |
| US-05 | 檢視角色資料與狀態 |
| US-06 | 地圖檢視事件地點 |
| US-07 | 角色關係網絡圖 |

**版本**

| 版本 | 觸發來源 | 主要變更 |
|---|---|---|
| v1 | 初版需求 | 初版 |
| v2 | v1 一致性檢核裁決 | 搜尋按 Enter 選取；地圖「全圖／山東」切換；關係圖預設以宋江為中心、圖例只列出現的類型；網址記住視圖 |

詳細的回饋來源與處置方式見 [`revisions.md`](make-mockups/shuihu-timeline/revisions.md)。

## 怎麼看這個範例

1. 先看影片，了解整體操作的樣子。
2. 打開 [`mockups/v2/index.html`](make-mockups/shuihu-timeline/mockups/v2/index.html)，直接在瀏覽器操作最終版 Mockup。
3. 讀 [`storyboard.md`](make-mockups/shuihu-timeline/storyboard.md)，看需求怎麼寫成「可以直接轉成 Mockup」的 User Story。
4. 比較 [`reviews/v1-consistency.md`](make-mockups/shuihu-timeline/reviews/v1-consistency.md) 與 v2 的 Story Board，看檢核結果怎麼回寫成新版需求。
5. 讀 [`handoff/v2/index.md`](make-mockups/shuihu-timeline/handoff/v2/index.md)，看 Mockup 定稿後怎麼打包交接給開發。
6. 讀 [`spec.md`](specs/001-shuihu-timeline-poc/spec.md)，看交接包怎麼轉成規格，以及每條 User Story、FR 怎麼用來源錨點指回 Story Board 和 Prototype。
7. 打開 [`brief/feature-brief.html`](specs/001-shuihu-timeline-poc/brief/feature-brief.html)，看人為 review 閘門給工程師看的導覽簡報。
8. 照上方「執行 POC」跑起 `AP/`，對照 Mockup v2 操作；再讀 [`handback-to-sa.md`](specs/001-shuihu-timeline-poc/handback-to-sa.md)，看開發端怎麼把偏離與缺口回寫給 SA。

## SDD 導入宣告

| 項目 | 值 |
|------|-----|
| 目前導入階段 | 第 1 階段（對齊基礎）|
| 服務風險分級 | 未分級（階段一）；POC，依對照表初判 Experimental |
| 應用類型 | 前端網頁應用 |
| 憲章基線 | chengfulin/sdd-baseline v5.6.0@4a4b2be |
