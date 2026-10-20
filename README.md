# make-mockup-harness 範例：水滸傳角色事件時間軸

這個 repo 是 skill **make-mockup-harness** 的範例，記錄一個需求從頭走到可互動 Mockup、再交接給 SDD 開發的完整過程，用來說明這個 skill 適合用在哪些情境，也方便分享給別人參考。

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
└── handoff/v2/                       # 交給 sdd-harness 的交接包，從 SDD-START.md 開始讀
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
5. 讀 [`handoff/v2/SDD-START.md`](make-mockups/shuihu-timeline/handoff/v2/SDD-START.md)，看 Mockup 定稿後怎麼交接給 sdd-harness 開發。
