# 文件索引：水滸傳角色事件時間軸 v2

「水滸傳角色事件時間軸」v2 的需求交接包，2026-10-27 交付。整個目錄原樣放進開發 repo（位置不限）並 commit 後唯讀；新版另開目錄。

- **人**：先讀 `handoff-notes.md`，再依下表開檔。
- **AI agent**：本包只屬於這次迭代，在開工的 prompt 裡指定位置與起點，例如：`需求來源：<本目錄路徑>（水滸傳角色事件時間軸 v2）。先讀 <本目錄路徑>/AGENTS.md，照其讀取順序進行。`
  repo 根的 AGENTS.md／CLAUDE.md 是常駐設定，不放本包的指標，否則下一版交接後仍會指向本版。
- **找來源**：依「取證方式」開檔，只讀「涵蓋」指到的段落；規格與任務以錨點（見 `AGENTS.md`「錨點」）指回本表的涵蓋項。

| 路徑 | 用途 | 媒材 | 大小 | 權威 | 取證方式 | 涵蓋（US／畫面／章節） |
|---|---|---|---|---|---|---|
| `handoff-notes.md` | 交接說明 | markdown | — | SA／PM 交接內容 | Read 全文 | US 對照、AC 原文、功能需求候選、已定案決策、範圍外、補問清單（PM 答案）、截圖索引 |
| `storyboard.md` | 需求與業務規則 | markdown | 16 KB | 業務規則 | Read；以 `### US-nn` 標題定位，只讀用到的 US 與全域規則 | US-01、US-02、US-03、US-04、US-05、US-06、US-07 |
| `prototype/index.html` | 可操作的 mockup | html（單檔） | 0.1 MB | 呈現 | **不整份 Read**：看截圖、限量 grep（`grep -o -m 5`）、或本機 http server 開啟操作 | S1 角色篩選列、S2 時間軸、S3 事件明細面板、S4 角色資料面板、S5 地圖、S6 關係圖 |
| `prototype/screens/*.png` | 畫面截圖 | png（1440×900 full-page） | — | 衍生自 Prototype，無獨立權威 | Read 看圖；檔名對應見 `handoff-notes.md`「截圖索引」 | 依截圖索引 |
| `prototype/export.json` | 凍結資訊 | json | 277 B | — | Read | 來源 artifact、版本 id、sha256 |
| `reference/v2-consistency.md` | 一致性檢核報告 | markdown | 7 KB | 參考，不具權威 | Read；只讀錨點或關鍵詞指到的節 | 操作驗證表、裁決 |
| `reference/v2-design-brief.md` | mockup 製作指示 | markdown | 27 KB | 參考，不具權威 | Read；只讀錨點或關鍵詞指到的節 | 畫面 ID 與畫面清單、假資料表、展示腳本 |
| `AGENTS.md`、`CLAUDE.md` | 給 AI agent 的讀取規則 | markdown | — | 本包的使用規則 | Read 全文 | 讀取順序、權威劃分、錨點、回寫格式 |

sha256：`storyboard.md` 1563fc610fcdfbea0be96b203a8061a02871ab29888d1d0074bc8b4edc5d2bf3；`prototype/index.html` 1df5b8df97ce5aefd3304a18ef277e573f5825bab78ca514a8053eb229b8e48c（= export.json）。
