<!--
Sync Impact Report
Version change: [none] → 1.0.0 (initial ratification)
Source baseline: chengfulin/sdd-baseline@4a4b2be (v5.6.0, 導入階段 1)
Loaded docs: constitution.md + constitution-frontend.md + constitution-deployment.md
Modified principles: n/a（初版）
Added sections: 規範用語、核心原則（§CP-1～6）、服務風險分級【參考】、分級適用之延伸要求（§TR）與附錄【參考】、
  前端網頁應用延伸（§FE）【參考】、部署與基礎設施延伸（§DEP）【參考】、治理（§GV-1/§GV-2/§GV-3 B 為必要，§GV-3 A【參考】）
Removed sections: n/a
Templates: 未修改（plan／spec／tasks template 於執行期讀取本憲章）
Follow-up TODOs: 無
-->
# Outlaws_of_the_Marsh 憲章

> 上游基線：團隊 SDD 憲章 v5.6.0（導入階段 1：對齊基礎）
> 應用類型：前端網頁應用；服務風險分級：階段一暫不分級（本專案屬 POC，依對照表初判為 Experimental，第一階段標示為 SHOULD）
>
> 本文件為**最高層級規範**。所有 spec、plan、task 與實作皆須遵循本憲章；下層文件與本憲章衝突時，以本憲章為準。
> 第 1 階段僅 **§CP-1～§CP-6 + 最小審查（§GV）** 為合併條件；標【參考】的章節全文保留但暫不強制。
> 基線原始副本位於 `.specify/memory/baseline/`（含 `manifest.json`）。

## 規範用語（RFC 2119）

本文件中的關鍵字依 RFC 2119 解釋：

- **MUST / 必須**：絕對要求，無例外。違反即視為不合格，不得合併（merge）。
- **MUST NOT / 禁止**：絕對禁止。
- **SHOULD / 應**：強烈建議。若不遵循，**必須在 spec 或 PR 中說明理由**。
- **MAY / 可**：選擇性，視情境決定。

## Core Principles

以下為核心原則（CP — 不可妥協，所有分級一律適用）。

以下六項為團隊 SDD 的共同底線，**任何分級、任何應用類型皆 MUST 遵循**，且不適用「低分級豁免」。

### §CP-1 Spec 與實作可追溯（Spec ↔ Implementation Traceability）

- 任何功能、修改或修復 **MUST** 可追溯至 spec 或需求來源（issue / 需求單）。**MUST NOT** 出現無來源的變更。
- Spec **MAY** 採輕量形式（如 issue 或 PR 描述），但 **MUST** 至少說明目的與驗收條件。完整 spec 欄位之要求依分級，見 §TR-1。
- 程式碼行為 **MUST** 與 spec 一致。實作過程發現 spec 有誤或不足，**MUST** 先更新 spec 再改程式碼，不得讓 spec 過時。

### §CP-2 機密不得提交（No Secrets in Source）

- 任何機密（access token、API key、帳號、密碼、連線字串、憑證、金鑰等）**MUST NOT** 寫死於程式碼、設定檔或 script，亦 **MUST NOT** 進入版本控制。
- 機密 **MUST** 透過環境變數讀取，由系統 / 部署環境注入；`.env` 等含機密檔案 **MUST** 列入 `.gitignore`。
- 機密 **MUST NOT** 出現在 log、錯誤訊息、API 回應或測試輸出中；輸出前 **MUST** 遮罩（如 `****`）。
- **SHOULD** 提供 `.env.example` 列出所需環境變數**名稱**與用途（不含真實值）。

### §CP-3 設定不得硬編碼（No Hardcoded Configuration）

- 所有會因環境而異的設定（base URL、domain、port、逾時、功能旗標等）**MUST** 透過環境變數或設定參數提供，**MUST NOT** 寫死。
- **MUST** 明確定義環境別（如 `APP_ENV` / `NODE_ENV`），至少含 `development` 與 `production`。
- 預設值僅可用於**非機密、非環境敏感**項目。

### §CP-4 核心邏輯需有測試（Core Logic Must Be Tested）

- 核心 / 主要商業邏輯 **MUST** 有自動化測試，涵蓋正常路徑與主要錯誤情境。
- 測試 **MUST** 可獨立、可重複執行，不依賴外部服務狀態（外部依賴 **SHOULD** 以 mock / stub 隔離）。
- 測試廣度（邊界全覆蓋）、覆蓋率門檻等依分級調整，見 §TR-2；測試案例設計方法見 §TR-7。

### §CP-5 變更需經審查（Changes Must Be Reviewed）

- 所有變更 **MUST** 透過版本控制管理，並經由 Pull Request 審查後合併。
- PR 審查 **MAY** 由 AI agent 執行，但最終合併 **MUST** 由人為核准，**MUST NOT** 由 AI agent 自動合併。
- PR **MUST** 連結對應的 spec 或需求來源。
- Commit 訊息 **SHOULD** 說明「為什麼」而非僅「做了什麼」。

### §CP-6 例外需可追蹤（Exceptions Must Be Traceable）

- 任何對 **MUST / MUST NOT** 的例外 **MUST** 可追蹤、有記錄（見 §GV-2 之記錄方式，低風險例外可採輕量模板）。
- 未經記錄之例外一律視為違規，不得合併。

## 服務風險分級（Service Risk Tiers）【參考】

> 【參考】本節於第 1 階段**暫不作為合併條件**；內容全文保留，供 plan／review 參照與日後升階。

核心原則（CP）對所有分級一律適用；**延伸要求（TR 與應用 / 基礎設施延伸）的強制程度依服務風險分級調整**，詳見附錄 B。

風險分級依「**資料敏感度 × 故障影響範圍（blast radius）× 對外承諾**」評估，而非僅看專案標籤。

| 風險分級 | 說明 | 典型情境 |
|---------|------|---------|
| **Critical（關鍵）** | 金流、認證授權、核心交易、個資 / PII、對外 SLA 服務 | 支付、登入、訂單核心 |
| **Standard（標準）** | 一般正式業務服務 | 多數正式微服務、業務 API |
| **Internal（內部）** | 內部工具或低風險輔助服務，不直接對外 | 內部後台、輔助 worker |
| **Experimental（實驗）** | POC / Spike / demo，生命週期短 | 技術試作、提案驗證 |

### 團隊專案類型 × 風險分級對照

團隊慣用的「專案類型」可對照下表初判風險分級，但**最終以實際風險評估為準**——同一專案類型可能因處理的資料與影響範圍落入不同風險級：

| 團隊專案類型 | 預設風險分級 | 升級 / 調整條件 |
|------------|------------|---------------|
| 正式專案 | Standard | 涉及金流 / 認證 / 核心交易 / 個資 → **Critical** |
| POC 專案 | Experimental | 將轉為正式且處理真實 / 敏感資料 → 重評為 **Standard**（必要時 Critical）；測試分割表擴充見 §TR-7 |
| 內部探索型實驗（Demo / 實驗）| Experimental（純試驗）/ Internal（長期內部工具）| 一旦對外開放 → 至少 **Standard** |
| 快速驗證 / 微調（Spike / Tweak）| Experimental | 套用其所依附**母服務**之風險分級 |

**解說**：專案類型描述「成熟度 / 意圖」，風險分級描述「出錯的後果」。兩者通常相關（POC 多為 Experimental、正式專案多為 Standard），但驅動規範強度的是**風險**。例如一個「POC」若直接讀寫正式個資庫，應以 Critical 對待；一個「正式專案」若只是內部唯讀儀表板，可降為 Internal。

規則：
- 每個服務 / 專案 **MUST** 在 README 或 spec 標示其**風險分級**（並建議註明對應的團隊專案類型）。此要求依導入階段漸進（見 [`README.md`](baseline/README.md) 三階段導入）：第一階段為 **SHOULD**，自第二階段起為 **MUST**。
- 風險**提升**時，**MUST** 在 spec / PR 補齊新分級對應的延伸要求。
- 未標示 → 預設以 **Standard** 處理；若無法判定且可能涉及敏感資料 → 以 **Critical** 處理。

## 分級適用之延伸要求（TR — Tiered Requirements）【參考】

> 【參考】本節於第 1 階段**暫不作為合併條件**；內容全文保留，供 plan／review 參照與日後升階。

本節規範**依服務風險分級調整**的延伸要求。各項強制程度的速查見**附錄 B（分級適用矩陣）**；以下為各項之內容細節。除另有標註，下列細節以 **Critical / Standard** 為基準描述。

### §TR-1 完整 Spec 與驗收測試

- 完整 spec **SHOULD** 描述：目的、輸入、輸出、行為、邊界條件、錯誤情境、驗收條件。
- Critical / Standard：每個驗收條件 **MUST** 對應至少一個自動化測試案例。
- 較低分級依附錄 B 放寬（Internal 為 SHOULD、Experimental 為 MAY），但 §CP-1 之可追溯性不可豁免。
- 由驗收條件推導之測試案例，設計方法 **SHOULD** 依 §TR-7（ISP）；此為「如何設計」之規範，不改變上述「每個驗收條件對應測試」之強制程度。

### §TR-2 測試廣度與覆蓋率（風險導向矩陣）

- 採**風險導向測試**，依服務風險分級決定必備測試類型（契約 / 整合測試之細節見 §SVC-2）：

  | 風險分級 | 必備測試 |
  |---------|---------|
  | **Critical** | unit + contract + integration + 失敗路徑（failure path）+ 資料遷移（migration）測試 |
  | **Standard** | unit + contract + 關鍵 integration |
  | **Internal** | 核心 unit + smoke 測試 |
  | **Experimental** | 以 PR 描述驗收即可（主要流程範圍之分割表 **MAY** 直接作為 PR 驗收情境清單，手動或自動執行皆可，見 §TR-7）；具核心商業邏輯者仍依 §CP-4 補最小單元測試 |

- 覆蓋率為**輔助指標，MUST NOT 作為唯一品質門檻**。僅對 API 服務適用數字參考：Critical / Standard **SHOULD** 達 statement ≥ 80%、branch ≥ 60%，且 **SHOULD** 優先要求 contract、核心 domain 與錯誤路徑測試，而非堆疊低價值測試衝高覆蓋率。
- **Shell Script 與前端應用不套用數字覆蓋率門檻**，以「主要邏輯、邊界與例外案例通過」為準（見 §SH-4、§FE-7）。
- **測試品質驗證**：Critical / Standard **SHOULD** 以 mutation testing 衡量測試的偵錯力——mutation score 衡量「殺得死錯誤」，較覆蓋率的「執行過」更能反映斷言品質；存活的 mutants **SHOULD** 作為補強測試案例的具體目標。本項為**週期性 / 抽樣式**品質驗證手段，非每次 PR 之強制閘門；主要適用於有成熟 mutation testing 工具支援之語言（如 API 服務），工具選型建議見 [`tech-standards.md`](baseline/tech-standards.md)。
- 測試之**案例設計方法**（輸入空間分割）見 §TR-7。

### §TR-3 相依套件安全（Dependency Security）

- 相依套件 **MUST**（Critical / Standard）/ **SHOULD**（Internal / Experimental）以 lock file 固定版本並納入版控。
- Critical / Standard CI **MUST** 執行相依套件安全掃描（如 `npm audit`、`pip audit`、`trivy`）；高危漏洞（CVSS ≥ 7.0）**MUST** 於合併前修復或取得例外核准（見 §GV-2）。Internal **SHOULD**、Experimental **MAY**（見附錄 B）。
- 掃描發現漏洞時 **SHOULD** 以 PR 提出修改建議，並說明：受影響的程式碼 / 邏輯範圍、修改內容、**不修正所承擔的風險**，供審查者判斷。
- **MUST NOT** 將開發用相依（devDependencies）打包進 production 產物。

### §TR-4 日誌與可觀測性（Logging & Observability）

- 結構化日誌（如 JSON、標註 log level）：Critical **MUST**、Standard **SHOULD**；對外部服務呼叫與錯誤 **SHOULD** 記錄足以追蹤的內容（request id、耗時、狀態）。
- 日誌 **MUST NOT** 記錄機密（見 §CP-2，此為核心原則，所有分級適用）。
- 分散式追蹤（跨服務 trace context）見 §SVC-4；較低分級之可觀測性程度依附錄 B。

### §TR-5 審計日誌（Audit Logging）

- **限後端服務**，且涉及**權限變更、機密操作，或安全敏感 / 商務關鍵資料**之新增 / 修改 / 刪除時：Critical / Standard **MUST** 寫入審計日誌，記錄操作者、動作、目標資源、時間、來源（IP / 請求 ID）、結果。
- 審計日誌 **MUST NOT** 記錄機密原始值；**SHOULD** 與一般日誌分離存放並控管存取；**MUST NOT** 被應用程式本身刪改。
- 不涉及上述敏感 / 關鍵資料的應用，或較低分級，依附錄 B（多為 SHOULD / MAY）。

### §TR-6 CI 合併閘門（依分級）

- 合併閘門分為「自動閘門」與「人工審查清單」，定義見 §GV-3；各項對各風險分級的強制程度見附錄 B。
- 核心原則相關之檢查（可追溯、無機密、經審查）為**所有分級的最低必要閘門**。

### §TR-7 測試案例設計（Input Space Partitioning）

- **方法**：測試案例以**輸入空間分割（ISP, Input Space Partitioning）**為優先設計方法，所有風險分級皆同；分級差異在於**採用強度**與**涵蓋範圍**，而非方法本身。
- **適用範圍與採用強度**（本條僅規範「若撰寫該層級測試，如何設計案例」；是否須撰寫依 §CP-4、§TR-1、§TR-2）：

  | 測試層級 | Critical | Standard | Internal | Experimental |
  |---------|:--------:|:--------:|:--------:|:------------:|
  | 核心 / 主要商業邏輯之單元測試（§CP-4）| MUST | MUST | SHOULD | SHOULD |
  | 由驗收條件推導之測試（§TR-1，含整合 / E2E）| SHOULD | SHOULD | SHOULD | SHOULD |

  驗收層之強度四級一致，分級差異僅在涵蓋範圍。無分支邏輯、純映射等瑣碎單元 **MAY** 豁免，但 **SHOULD** 於 spec / PR 說明。

- **ISP 步驟**：
  1. 識別輸入空間**特徵（characteristics）**：單元層為參數、相依狀態、環境設定等會影響行為的輸入；驗收層為操作角色、輸入資料類別、前置 / 系統狀態、外部相依回應等，**SHOULD** 取自驗收條件之前置與輸入（如 Given-When-Then），分割表 **SHOULD** 可追溯至驗收條件編號（§CP-1）。
  2. 將每個特徵分割為**互斥區塊（blocks）**；分割方式**視特徵型別適用**——數值 / 有序型涵蓋有效值、無效值與邊界值；布林 / 列舉等離散型以等值類劃分即可。
  3. 依下列**涵蓋範圍**選擇涵蓋準則。完整範圍下，特徵間**互動風險高**（如旗標 × 狀態的組合共同決定行為）時，該組特徵 **SHOULD** 升級至 Pairwise 或 Base Choice；E2E 層因組合成本高，不建議採 Pairwise。

- **涵蓋範圍（依分級）**：

  | 範圍 | 適用分級 | 特徵 | blocks | 涵蓋準則 | 省略記錄 |
  |------|---------|------|--------|---------|---------|
  | **完整範圍** | Critical / Standard / Internal | 所有會影響行為的特徵 | 有效值、無效值、邊界值 | **Each Choice** 為下限（升級見步驟 3）| 有意省略之 block **SHOULD** 逐項註明理由 |
  | **主要流程範圍** | Experimental | 僅主要流程涉及之特徵 | 僅主要流程情境內之 blocks，加上該流程中可能觸發之錯誤 | **Base Choice**（以主要流程為 base，每次只變動一個特徵）或 **Each Choice**，**SHOULD** 於分割表註明所選 | 範圍外情境於 spec / README **一次性宣告**即可，無須逐 block 說明 |

  「主要流程」依 Experimental 型態界定：POC / Demo 為**展示情境**、Spike 為**驗證目標**、Tweak 為**變更點**。主要流程範圍界定的是案例設計之範圍，**不增加**依 §CP-4 / §TR-2 須撰寫之測試數量。

- **轉正式**：Experimental 重評為較高分級時（見「團隊專案類型 × 風險分級對照」），既有分割表 **SHOULD** 擴充至完整範圍（補齊特徵與無效 / 邊界 block），而非重寫。
- **預期結果以 spec 為據（oracle 來源）**：適用單元層與驗收層。分割表與測試案例的預期結果 **MUST**（Critical）/ **SHOULD**（Standard / Internal）/ **MAY**（Experimental）自 spec / 需求導出（驗收層即驗收條件所述之預期結果），而非現有實作；Experimental 以主要流程情境之預期行為為準即可。為既有程式碼事後補測試時，無 spec 依據、僅鎖定現狀行為的斷言 **SHOULD** 標註為 characterization test（形式不拘，如測試名稱或註解），以免將潛在缺陷鎖成預期行為。
- 本條 **MUST NOT** 被用於堆疊低價值測試案例；案例價值優先序仍依 §TR-2。
- 測試案例 **SHOULD** 可看出對應的分割依據（如以測試名稱或註解標明「特徵＝區塊」，形式不拘）。
- 分割結果 **SHOULD** 以簡表（特徵 / blocks / 邊界值 / 涵蓋準則）記錄於 spec 或測試檔開頭註解供審查——審查焦點為分割表**存在且內容合理**；工作流上建議**先產出分割表、審閱後再生成測試碼**（時序為工作流建議，非審查判準）。例如：

  | 特徵 | blocks | 代表案例 |
  |------|--------|---------|
  | `amount` | 正數 / 0 / 負數 / 超過上限 | `amount=負數 → 拒絕` |
  | `token` 狀態 | 有效 / 已過期 / 格式錯誤 | `token=已過期 → 401` |

  （涵蓋準則：Each Choice；邊界值列於各特徵之 blocks 中）

- 本條規範**案例設計方法**；測試類型組合見 §TR-2，驗收條件對應見 §TR-1。

### §TR-8 變更影響範圍宣告（Change Scope Declaration）

- **適用範圍**：規劃新功能或修改現有功能的 tech plan / task 時。
- 規劃時 **SHOULD**（Critical / Standard）/ **MAY**（Internal / Experimental）先宣告預計修改的程式架構範圍，至少涵蓋：**受影響的模組、分層**（見 §API-4）、**主要檔案區域**，以及**明確不受影響的範圍**。宣告旨在使 AI agent 與實作者聚焦，避免改動毫不相關之內容。
- diff 內的變更 **MUST** 可追溯至 spec（§CP-1，所有分級適用，不以是否宣告為前提）；已宣告影響範圍者，超出宣告範圍的修改 **MUST** 先更新宣告 / spec，或依 §CP-6 記為例外。
- 宣告結果可作為 §TR-7 ISP 案例設計的受測單元 / 驗收範圍清單。
- 宣告無固定格式，下列為最小參考範本：

      受影響模組：<領域名稱>
      變更分層：<Application / Domain / Infrastructure>（見 §API-4）
      不受影響：<明確排除的模組或服務>

### 附錄 A：通用環境變數命名建議

| 用途 | 建議變數名 | 範例值 | 備註 |
|------|-----------|--------|------|
| 環境別 | `APP_ENV` / `NODE_ENV` | `development` / `production` | 控制 Swagger 等行為（見 §API-3）|
| 服務 Base URL | `<SERVICE>_BASE_URL` | `https://api.example.com` | 不得寫死（§CP-3、§SH-1）|
| API 金鑰 | `<SERVICE>_API_KEY` | （由環境注入）| 機密，遮罩處理（§CP-2）|
| 存取權杖 | `<SERVICE>_ACCESS_TOKEN` | （由環境注入）| 機密 |
| 帳號 / 密碼 | `<SERVICE>_USERNAME` / `<SERVICE>_PASSWORD` | （由環境注入）| 機密 |
| 連線字串 | `DATABASE_URL` | （由環境注入）| 機密 |
| CORS 允許 Origin | `CORS_ALLOWED_ORIGINS` | `https://app.example.com` | 逗號分隔，不得用 `*`（見 §API-9）|
| 監聽埠 | `PORT` | `3000` | 不得寫死 |
| 前端 API Base URL | `VITE_API_BASE_URL` | `https://api.example.com` | 僅限非機密設定（見 §FE-3）|

### 附錄 B：分級適用矩陣（Tiered Compliance Matrix）

欄位為**服務風險分級**；**核心原則（§CP-1–§CP-6）對所有分級皆 MUST，故未列入下表**（不可豁免）。下表為**延伸要求**的強制程度（標 `—` 表不適用）：

| 延伸要求 | Critical | Standard | Internal | Experimental | 規範 |
|---------|:--------:|:--------:|:--------:|:------------:|------|
| 完整 spec 欄位 | MUST | MUST | SHOULD | MAY | §TR-1 |
| 每個驗收條件對應測試 | MUST | MUST | SHOULD | MAY | §TR-1 |
| 風險導向測試組合（unit/contract/integration…）| 見 §TR-2 | 見 §TR-2 | 見 §TR-2 | 見 §TR-2 | §TR-2 |
| 核心邏輯單元測試案例以 ISP 設計（方法）| MUST | MUST | SHOULD | SHOULD | §TR-7 |
| （若撰寫）驗收測試案例以 ISP 設計（方法）² | SHOULD | SHOULD | SHOULD | SHOULD | §TR-7 |
| ISP 涵蓋範圍³ | 完整 | 完整 | 完整 | 主要流程 | §TR-7 |
| 測試預期結果以 spec 為據（oracle；單元與驗收層）| MUST | SHOULD | SHOULD | MAY | §TR-7 |
| Mutation testing 驗證測試品質（週期性；限有成熟工具之語言）| SHOULD | SHOULD | MAY | — | §TR-2 |
| 變更影響範圍宣告 | SHOULD | SHOULD | MAY | MAY | §TR-8 |
| 覆蓋率參考（API：stmt≥80/branch≥60）| SHOULD | SHOULD | — | — | §TR-2 |
| Lint / 靜態分析 | MUST | MUST | SHOULD | MAY | §GV-3 |
| 機密掃描（自動，CI）| MUST | MUST | SHOULD | SHOULD | §CP-2¹ |
| 相依套件安全掃描 | MUST | MUST | SHOULD | MAY | §TR-3 |
| 容器映像掃描 | MUST | SHOULD | SHOULD | MAY | §DEP-2 |
| 審計日誌（敏感 / 關鍵資料後端）| MUST | MUST | SHOULD | MAY | §TR-5 |
| 結構化日誌 | MUST | SHOULD | MAY | MAY | §TR-4 |
| 跨服務 trace context 傳遞 | MUST | MUST | MAY | MAY | §SVC-4 |
| 對外 API / 契約文件（REST→OpenAPI 等）| MUST | MUST | SHOULD | MAY | §API-2 |
| schema 破壞性變更檢查 | MUST | MUST | SHOULD | MAY | §SVC-2 |
| 互動式 API 文件受保護（不匿名公開）| MUST | MUST | MUST | SHOULD | §API-3 |
| 責任分層（transport/app/domain/infra）| MUST | MUST | SHOULD | MAY | §API-4 |
| 韌性（timeout/retry/circuit breaker）| MUST | SHOULD | MAY | MAY | §SVC-5 |
| 資料所有權邊界 | MUST | MUST | SHOULD | MAY | §SVC-6 |
| 並行安全（避免 race condition）| MUST | MUST | SHOULD | MAY | §SVC-8 |
| 容器化（docker）+ compose 部署 | MUST | MUST | SHOULD | MAY | §DEP-2/§DEP-3 |
| 第三方映像版本鎖定（禁 `:latest`）| MUST | MUST | SHOULD | SHOULD | §DEP-4 |
| 資料儲存連線拓樸中立（設定外部化）| MUST | MUST | SHOULD | MAY | §DEP-5 |
| 檔案儲存路徑 / 憑證外部化 | MUST | MUST | SHOULD | MAY | §DEP-6 |
| production 安全 header（前端 / 代理）| MUST | MUST | SHOULD | MAY | §FE-2 / §DEP-7 |
| CSP（前端）| SHOULD | SHOULD | MAY | MAY | §FE-2 |

> ¹ 「不得提交機密」本身為核心原則（§CP-2，所有分級 MUST）；此列指**自動化掃描**的 CI 強制程度。
>
> ² 僅規範已撰寫之驗收層測試如何設計；是否須撰寫依 §TR-1 / §TR-2（Experimental 可僅以 PR 描述驗收）。
>
> ³ 此列值為**涵蓋範圍**而非強制程度；「完整」與「主要流程」之定義見 §TR-7。

**所有分級的最低必要閘門**（對應核心原則）：可追溯 spec / 需求來源（§CP-1）、無機密進版控（§CP-2）、經人為核准審查（§CP-5）。Critical / Standard 另須通過上表對應之 MUST 項。

## 前端網頁應用延伸（FE）【參考】

> 【參考】本節於第 1 階段**暫不作為合併條件**；內容全文保留，供 plan／review 參照與日後升階。
> 技術選型偏離（例如未採 §FE-1 建議的 Vue）依 §FE-1 於 spec／plan 說明理由。

本章在核心原則基礎上補充前端網頁應用（SPA / SSR）專屬規範。

### §FE-1 框架與技術選型

- 前端應用 **MUST** 採用成熟、社群活躍的框架與建置工具產生最佳化產物。
- 具體框架選型非本憲章強制項，**SHOULD** 依團隊技術標準建議（見 [`tech-standards.md`](baseline/tech-standards.md)，建議採用 **Vue 3 以上版本**）；採用其他框架時 **SHOULD** 在 spec / PR 說明。
- 採用 Vue 時 **SHOULD** 使用 Composition API 與 `<script setup>`；建置工具 **SHOULD** 採用 Vite。
- **SHOULD** 使用 TypeScript 以強化型別安全。
- 共用狀態 **SHOULD** 以統一的狀態管理機制（如 Pinia）管理，**MUST NOT** 以散落的全域變數共享狀態。

### §FE-2 安全標頭與內容安全政策（Security Headers & CSP）

> 安全標頭可能由前端應用或反向代理設定；**責任歸屬之分界見 §DEP-7**（須單一負責，避免重複或遺漏）。

- **production 部署 MUST 具備基本安全 HTTP 標頭策略**（至少涵蓋如 `X-Content-Type-Options: nosniff`、`X-Frame-Options` / `frame-ancestors` 等）。
- 應用 **SHOULD** 導入 CSP（`Content-Security-Policy` 標頭或同等 meta），作為安全成熟度目標；**MAY** 先以 `Content-Security-Policy-Report-Only` 模式於導入期驗證，再切換為強制執行。
- 採用 CSP 時：
  - `default-src` **SHOULD** 以 `'self'` 為基準並明確列舉允許來源；**SHOULD NOT** 使用萬用 `*` 作為 script/style/connect 等敏感指令來源。
  - **SHOULD NOT** 使用 `'unsafe-eval'`；如需 inline script **SHOULD** 改用 nonce 或 hash 而非 `'unsafe-inline'`。
  - 允許來源（如 API domain、CDN）**MUST NOT** 寫死於程式碼，須可隨環境調整（見 §CP-3）。
- **SHOULD** 設定 `report-uri` / `report-to` 蒐集違規回報，並撰寫自動化檢查驗證 production 建置帶有預期的安全標頭。

### §FE-3 前端機密與設定

- 前端產物為**公開可讀**，**MUST NOT** 將任何機密（API key、access token、密碼、私鑰等）打包進前端 bundle 或經由 `VITE_*` 等建置變數注入。
- 需要機密的操作 **MUST** 由後端代理（backend-for-frontend / API proxy）執行，前端僅持有短期、範圍受限的使用者憑證。
- 僅**非機密**的環境設定（如 API base URL）**MAY** 透過建置期環境變數注入，且 **MUST NOT** 寫死（見 §CP-3）。

### §FE-4 元件與分層架構

- **MUST** 採元件化設計，並區分職責，各層不得混雜：
  - **展示元件（Presentational）**：負責 UI 呈現，**MUST NOT** 直接發出 API 請求或處理商務邏輯。
  - **容器 / 頁面元件（Container / View）**：負責組裝與互動編排。
  - **API / Service 層（composable 或 service 模組）**：負責對後端的資料存取，**MUST** 集中管理，**MUST NOT** 散落於各展示元件中。
  - **狀態層（Store）**：負責跨元件共用狀態。
- 路由 **SHOULD** 集中管理（統一的 router 設定，或框架內建之檔案式路由慣例）；需要授權的路由 **MUST** 設有 navigation guard（並理解前端守衛僅為 UX，真正授權 **MUST** 由後端把關）。

### §FE-5 前端安全（XSS 與輸出處理）

- **MUST NOT** 將未經淨化（sanitize）的不可信內容傳入 `v-html`；如必須渲染 HTML，**MUST** 先以白名單淨化（如 DOMPurify）。
- 所有外部輸入在呈現前 **MUST** 適當編碼 / 轉義，避免 XSS。
- 應用 **MUST NOT** 假設自己以非安全來源（非 HTTPS）運行；對外的 TLS / HTTPS 落點見 §DEP-7。
- **SHOULD** 防範 OWASP 前端相關風險（XSS、CSRF、clickjacking 等）。
- 存放於瀏覽器的使用者憑證 **SHOULD** 優先採用 `HttpOnly` cookie；若存於前端可讀儲存，**MUST** 評估並記錄 XSS 竊取風險。

### §FE-6 可用性與品質（Accessibility & Quality）

- **SHOULD** 遵循基本無障礙規範（語意化標籤、鍵盤可操作、適當對比與 ARIA 屬性）。
- **SHOULD** 設定靜態資源快取與程式碼分割（code splitting），控制首屏載入體積。

### §FE-7 測試

- 前端 **不**套用數字覆蓋率門檻。**MUST** 依 §CP-4 撰寫元件 / 單元測試（**SHOULD** 採用 Vitest + Vue Test Utils），以涵蓋主要功能邏輯、邊界與例外情境為驗收基準。
- 測試 **MUST** 涵蓋元件的正常渲染、互動行為、邊界與錯誤狀態；對 API 呼叫 **SHOULD** 以 mock 隔離。
- 核心邏輯之單元測試與 E2E 關鍵流程之案例設計方法依 §TR-7（輸入空間分割，強度與涵蓋範圍依分級適用）。
- 關鍵使用者流程 **SHOULD** 另以端對端（E2E）測試（如 Playwright / Cypress）驗證。

## 部署與基礎設施延伸（DEP）【參考】

> 【參考】本節於第 1 階段**暫不作為合併條件**；內容全文保留，供 plan／review 參照與日後升階。

本章規範**跨應用類型的部署與基礎設施治理**：容器化通則、Compose 部署、第三方容器服務、資料儲存拓樸、檔案儲存與反向代理。適用於專案中**所有自行開發、需部署的服務**，以及其所依賴的基礎設施。

### §DEP-1 適用範圍（Scope）

- 本章適用於**所有自行開發、需部署的服務**：AP 前端、AP 後端 / 微服務、工具服務（Python / Shell 等），不論其應用類型。
- 同時涵蓋專案運行所依賴的**第三方容器服務、資料儲存、檔案儲存與反向代理 / 閘道**之整合與部署治理。
- 與各應用延伸並行載入，例如：容器化前端 = 核心 + FE + 本章；後端微服務 = 核心 + API + SVC + 本章；容器化工具服務 = 核心 + 本章（+ SH / API 視實作）。

### §DEP-2 容器化通則（Containerization）

- 自行開發、需部署的服務 **MUST** 容器化：提供 **Dockerfile**，產出可重現的 OCI 映像。
- 映像 **MUST** 以 **non-root** 使用者執行；**SHOULD** 採最小基底映像；容器映像安全掃描依附錄 B：Critical **MUST**、Standard **SHOULD** 通過。
- **長駐服務** **MUST** 提供 **health / readiness / liveness** 探針並支援 **graceful shutdown**（收到終止訊號後完成在途工作、釋放資源）；應用端點行為見 §API-7，本節規範其作為部署探針之使用。
- **一次性 / 批次工具** **MUST** 以明確 exit code 表示成敗（呼應 §SH-3）。
- 設定與機密 **MUST** 由環境變數注入（§CP-2、§CP-3），**MUST NOT** 烘焙進映像；啟動時 **SHOULD** 驗證必要設定存在。
- 映像 **MUST NOT** 包含機密、私鑰或開發用憑證。

### §DEP-3 Docker Compose 為主要部署（Compose-First）

- 部署 **以 Docker Compose 為主要實現目標**：**MUST** 提供可一鍵啟動「應用服務 + 其所需依賴」的 `docker-compose.yml`（或等效），供本機開發與基本部署。
- Compose 設定 **SHOULD** 涵蓋整體堆疊（前端、後端、工具服務及所需第三方服務），並以環境變數**參數化所有環境相依設定**（連線、port、來源、掛載路徑），**MUST NOT** 寫死（§CP-3）。
- **Kubernetes 為客戶端部署選項，優先度低**：**MAY** 另提供 K8s manifests / Helm chart，但 **MUST NOT** 將 K8s 設為服務可運行的前提；服務 **MUST** 能在純 Docker Compose 環境正常運作。

### §DEP-4 第三方 / 官方容器服務（Third-Party Services）

> 如 Redis、RabbitMQ、Nginx、Traefik、langflow 等官方提供之容器化服務。

- **SHOULD** 優先採用**官方 / 可信來源**之映像。
- 映像版本 **MUST** 以明確標籤或 digest **鎖定**，**MUST NOT** 使用 `:latest`，以確保部署可重現。
- **SHOULD** 將第三方映像納入漏洞掃描，並定期評估安全更新（呼應 §TR-3 相依安全精神）。
- 其設定與機密（密碼、連線字串）**MUST** 由環境變數 / 設定注入（§CP-2、§CP-3），**MUST NOT** 寫死或提交預設密碼進版控。
- 具狀態的第三方服務（如 Redis、RabbitMQ、訊息 / 快取）**MUST** 規劃持久化 volume 與資料保存 / 還原策略。

### §DEP-5 資料儲存部署拓樸（Data Store Topology）

> 如 Postgres、MongoDB、MSSQL、OpenSearch、Elasticsearch 等。

- 資料庫 / 搜尋引擎之部署形式（binary、容器、cluster、或客戶託管）**因專案需求而異**；服務 **MUST NOT** 假設特定部署拓樸。
- 連線資訊（host、port、認證、TLS）**MUST** 一律經設定 / 環境變數提供（§CP-3、§CP-2）；切換拓樸 **MUST NOT** 需要改動程式碼。
- 服務 **SHOULD** 容忍儲存的暫時不可用（連線重試 / 逾時，呼應 §SVC-5），並於啟動時驗證連線設定。
- 資料所有權依 §SVC-6：即使共用同一套（託管）DB，各服務 **MUST** 僅存取自身擁有的 schema / 資料，**MUST NOT** 跨服務直接讀寫他者資料。
- Schema 變更 **MUST** 以可重複、可回溯的 **migration** 管理；Critical 另需 migration 測試（見 §TR-2）。

### §DEP-6 檔案儲存（File Storage：NFS / NAS）

> NFS 可能由 host 主機本地建置；NAS 通常由客戶提供（含連線與權限）。

- 檔案儲存的路徑、掛載點與存取憑證 **MUST** 由設定 / 環境變數提供（§CP-2、§CP-3），**MUST NOT** 寫死；客戶提供之 NAS 連線 / 權限由部署環境注入。
- 服務 **MUST NOT** 假設本地檔案系統永遠可用；檔案存取 **SHOULD** 經抽象介面，以便在 host 本地 NFS 與客戶 NAS 間切換。
- **MUST** 處理儲存的不可用、權限不足與部分失敗，並以明確錯誤回報，**MUST NOT** 靜默吞錯。
- 多實例共享同一儲存時（呼應可擴展性 §SVC-8），對同一檔案 / 路徑的並行寫入 **MUST** 防範 race condition（如檔名唯一化、寫暫存檔再原子改名、或檔案鎖）。
- 含機密 / 個資之檔案存取 **SHOULD** 遵循最小權限，並依需要納入審計（§TR-5）。

### §DEP-7 反向代理 / 閘道（Reverse Proxy / Gateway：Nginx / Traefik）

- 對外流量 **SHOULD** 經反向代理 / 閘道，由其負責 **TLS 終結**、路由，以及（可選）邊緣限流與安全標頭。
- **安全標頭 / CORS 之責任歸屬 MUST 明確**（由應用或代理其一負責，避免重複或遺漏）；無論由何者負責，最終對外行為 **MUST** 符合 §API-9（CORS）與 §FE-2（安全標頭）。
- 應用服務 **MUST NOT** 假設自己直接對外暴露；解析 `X-Forwarded-For` / `X-Forwarded-Proto` 等轉送標頭時 **MUST** 僅信任來自可信代理的值，避免來源偽造。
- 代理設定（上游位址、對外域名、憑證路徑）**MUST** 外部化（§CP-3），**MUST NOT** 寫死。

## Governance

### 第 1 階段的必要範圍（最小審查）

- **必要（MUST）**：§GV-1 修訂、§GV-2 例外處理（§CP-6 引用之記錄方式）、§GV-3 B 人工審查清單與最低必要閘門。
- **【參考】**：§GV-3 A 自動閘門（依附錄 B 與分級，第 1 階段暫不作為合併條件）。

### §GV-1 修訂

- 本憲章之修訂 **MUST** 透過 PR 進行，並記錄變更理由與版本。
- 版本採語意化版本（SemVer）：**MAJOR** 移除 / 重新定義原則或重編識別碼造成不相容；**MINOR** 新增或實質擴充；**PATCH** 文字釐清。

### §GV-2 例外處理

- **Critical / Standard**：對 **MUST / MUST NOT** 的例外 **MUST** 經審查同意並完整記錄於 spec / PR：理由、影響範圍、後續處理計畫。
- **低風險例外**（如較低分級、非機密、無對外影響）**MAY** 採**輕量例外模板**：一行說明「例外項目 + 理由 + 預計補齊時機」即可，仍須可追蹤（§CP-6）。
- **預設豁免**：Internal 與 Experimental 分級，對「延伸要求（TR / 應用 / 基礎設施延伸）」中標為非 MUST 的項目**預設豁免**，無須逐項記錄例外；但核心原則（CP）之例外**仍須記錄**。

### §GV-3 合規檢查（自動閘門 vs 人工審查）

合併閘門分為兩類，依服務風險分級套用（範圍見附錄 B）：

【參考】**A. 自動閘門（由 CI 執行；各項強制程度依附錄 B）——僅放可機器驗證的項目：**

- 測試通過、lint、機密掃描、相依套件安全掃描、API / 事件 schema 破壞性變更檢查（schema / contract diff）、容器映像掃描、覆蓋率報告。

**B. 人工審查清單（PR 審查者 MUST 逐項確認）——無法完全自動化者：**

> 清單項目對應之條款於**該服務分級**為 SHOULD / MAY 時，「確認」指確認其**已落實、已於 spec / PR 記載不遵循之理由、或屬 §GV-2 預設豁免**，而非將該條款升級為強制達成；於該分級為 MUST 者，未遵循仍須依 §GV-2 例外處理。

- spec 與實作是否一致；
- 架構責任分離是否合理、分層是否混雜；
- 變更範圍是否收斂：diff 是否僅含與 spec 相關之變更，無夾帶無關修改（scope creep）（見 §TR-8）；
- 測試案例設計是否附分割表、涵蓋範圍是否符合分級（完整 / 主要流程）、預期結果是否以 spec 為據（見 §TR-7）；
- 例外是否可接受且已記錄（§GV-2）；
- 可觀測性（log / trace / metric）是否足夠；
- 資料邊界 / 所有權是否正確（見 §SVC-6）；
- 風險分級標示是否與實際相符。

- 審查者（人為或 AI agent）**MUST** 依清單確認後方可批准；最終合併 **MUST** 由人為核准（見 §CP-5），**MUST NOT** 由 AI agent 自動合併。
- 核心原則相關之最低必要閘門（可追溯、無機密、經審查）對**所有分級**皆強制。

**Version**: 1.0.0 | **Ratified**: 2026-10-29 | **Last Amended**: 2026-10-29
