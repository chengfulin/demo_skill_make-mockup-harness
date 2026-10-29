# Quickstart: 水滸傳角色事件時間軸（一頁式前端 POC）

**Feature**: `001-shuihu-timeline-poc` | **Plan**: [plan.md](./plan.md)

所有指令都在 `AP/` 下執行（repo 根沒有 package.json）。下列 npm scripts 由實作階段建立於 `AP/package.json`。

## 前置

- Node.js 24 LTS、npm
- 本機安裝 Chrome 與 Edge 最新版（`chrome`／`compare`／`msedge` project 以 `channel: 'chrome'`／`channel: 'msedge'` 使用本機瀏覽器，Playwright 不下載）
- Playwright 瀏覽器：`npx playwright install chromium` 與 `npx playwright install webkit firefox`（WebKit／Firefox 供 SC-004 抽驗）

## 安裝與設定

```bash
cd AP
npm ci
cp .env.example .env.local   # 只有非機密設定；不改也能跑
```

| 變數 | 用途 | 預設 |
| :---- | :---- | :---- |
| `VITE_BASE_PATH` | 部署子路徑（GitHub Pages 例：`/<repo>/`） | `/` |
| `VITE_DATA_BASE_URL` | 靜態資料位置 | `${BASE_URL}data/` |

## 資料（一次性）

```bash
npm run data:convert   # scripts/convert-prototype-data.mjs：Prototype 內嵌 DATA → public/data/*.json，並跑 validateDataset
```

預期：輸出 6 個檔，筆數 12／120／22／54／32／13，驗證通過。檔案 commit 後不需再跑（見 [data-model.md §2](./data-model.md#2-prototype-假資料轉換apscriptsconvert-prototype-datamjs)）。

## 開發

```bash
npm run dev            # Vite dev server，http://localhost:5173/#timeline
```

手動驗證（展示情境 6 步，SC-002）：進站看時間軸「共 54 個事件」→ 搜尋「豹子頭」按 Enter 選林沖 → 點「大鬧野豬林」、點魯智深頭像 → 點林沖名字看狀態條 → 「只看此角色」後切「地圖」看行跡 → 切「關係圖」點節點開資料。

## 測試

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm test               # Vitest（domain／data／state／components），一次跑完
npm run test:watch     # Vitest watch
```

預期：純函式測試涵蓋 [data-model.md §5](./data-model.md#5-衍生規則純函式domain) 的規則與 §7 的 AC 數字；元件測試涵蓋載入中、載入失敗＋重試（AC-S4／AC-S5）。

## 建置與預覽

```bash
npm run build          # tsc + vite build → dist/（含 dist/data/*.json）
npm run preview        # 以 dist/ 起本機伺服器，http://localhost:4173/
```

部署：把 `dist/` 發布到靜態網站（如 GitHub Pages），建置時以 `VITE_BASE_PATH` 指定子路徑。

## E2E

```bash
npm run e2e            # Playwright chrome project：先 build＋preview，再跑 e2e/ 下除 prototype-compare 以外的全部 spec（us1～us7、us4-prevnext-from-character、responsive、demo-scenario；Chrome，1440×900 與 400×800）
npm run e2e:compare    # compare project：只跑 e2e/prototype-compare.spec.ts
npm run check:ac       # 核對 87 個驗收編號（AC-01～18、AC-P1～42、AC-S1～27）都有 E2E 測試名稱涵蓋
npm run e2e:browsers   # SC-004 抽驗：WebKit／Firefox／Edge（msedge）最新版跑標 @demo 的展示情境 6 步（D-6）
npx playwright show-report
```

預期：
- `npm run e2e` 跑的 spec 逐條對應 spec 的 AC／AC-P／AC-S 共 87 條（測試名稱帶編號，對應表見 tasks「AC → E2E 對應」），全數通過即 SC-001。
- `e2e:compare` 依 [ui-contracts「21 個狀態」](./contracts/ui-contracts.md#21-個狀態的重現步驟與-dom-斷言e2efixturesprototypestatests)重現狀態，DOM 斷言全過，並輸出 21 張同名截圖到 `AP/test-results/compare/`。
- 並列目視（SC-003）：把 `AP/test-results/compare/<檔名>.png` 與 `.specify/context/shuihu-timeline/v2/prototype/screens/<檔名>.png` 逐張對看區塊順序、相對位置、逐字文案、狀態標籤；#20、#21（S6-02、S6-03）圖例說明不同屬偏離 D-4，不計逐字一致。

## 疑難

- 畫面停在「資料載入失敗」：確認 `public/data/*.json` 存在且 `VITE_DATA_BASE_URL` 指到正確路徑。
- 部署後資源 404：`VITE_BASE_PATH` 未設成 repo 子路徑。
