/**
 * E2E 共用工具（T038）：AC E2E 與 Prototype 並列比對共用。
 *
 * 定位一律依 contracts/ui-contracts.md 的 `data-page`／`data-testid`／role／label，不依 class 以外的實作細節；
 * 唯一例外是角色 chip 的 pick 鈕（Prototype `.chip > button.pick[aria-pressed]` 內 `.nm` 為姓名）。
 *
 * 用法：
 *   import { test, expect } from './fixtures/app';
 *   test('…', async ({ page, app }) => { await app.goto('map'); await app.pickCharacter('林沖'); … });
 * 或直接呼叫具名函式（第一個參數為 page）。
 */
import { test as base, expect, type Locator, type Page } from '@playwright/test';

export { expect };

export type ViewLabel = '時間軸' | '地圖' | '關係圖';

/** ui-contracts 的 `data-page` 值。 */
export const PAGES = {
  S1: 'S1 角色篩選列',
  S2: 'S2 時間軸',
  S3: 'S3 事件明細面板',
  S4: 'S4 角色資料面板',
  S5: 'S5 地圖',
  S6: 'S6 關係圖',
} as const;

export type PageKey = keyof typeof PAGES;

/** 依 ui-contracts 的畫面代號取 `data-page` 區塊。 */
export function pageBlock(page: Page, key: PageKey): Locator {
  return page.locator(`[data-page="${PAGES[key]}"]`);
}

/**
 * 開啟 App 並等資料載入完成（`data-testid="loading"` 消失）。
 * `hash` 可為 `timeline`／`#map` 等；以相對路徑解析，部署子路徑（VITE_BASE_PATH）下同樣可用。
 * 只等「載入結束」，不斷言成功：載入失敗的情境由呼叫端自行斷言 `load-error`。
 */
export async function gotoApp(page: Page, hash?: string): Promise<void> {
  const fragment = hash ? `#${hash.replace(/^#/, '')}` : '';
  await page.goto(`./${fragment}`);
  // 先等 App 掛載後的終態（main 或載入失敗）出現，避免在 loading 尚未渲染前就誤判「已消失」。
  await page.locator('main, [data-testid="load-error"]').first().waitFor({ state: 'attached' });
  await expect(page.getByTestId('loading')).toHaveCount(0);
}

/** 角色清單中某角色 chip 的 pick 鈕（姓名逐字比對）。 */
export function characterPickButton(page: Page, name: string): Locator {
  return page
    .getByTestId('char-list')
    .locator('button.pick[aria-pressed]', { has: page.getByText(name, { exact: true }) });
}

/** 點角色 chip 的 pick 鈕（切換選取），並等 `aria-pressed` 翻轉。 */
export async function pickCharacter(page: Page, name: string): Promise<void> {
  const button = characterPickButton(page, name);
  const before = await button.getAttribute('aria-pressed');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true');
}

/** 點 chip 的資料鈕（`aria-label="<姓名> 角色資料"`），並等 S4 角色資料面板出現。 */
export async function openCharacterInfo(page: Page, name: string): Promise<void> {
  await page
    .getByTestId('char-list')
    .getByRole('button', { name: `${name} 角色資料`, exact: true })
    .click();
  await expect(pageBlock(page, 'S4')).toBeVisible();
}

/**
 * 選大節（`select[aria-label="大節"]`）。`name` 可為大節名（選項文字為「<大節名>（第 a–b 回）」）
 * 或完整選項文字（如「全部大節（第 1–120 回）」）；也接受「全部大節」。
 */
export async function selectArc(page: Page, name: string): Promise<void> {
  const select = page.locator('select[aria-label="大節"]');
  const labels = (await select.locator('option').allTextContents()).map((s) => s.trim());
  const label = labels.find((l) => l === name || l.startsWith(`${name}（`));
  if (label === undefined) throw new Error(`大節選單找不到「${name}」；現有選項：${labels.join('、')}`);
  await select.selectOption({ label });
}

/** 切換視圖（S1 結果列的 `role="tab"`；不含地圖內的「全圖／山東」分頁），並等 `aria-selected="true"`。 */
export async function switchView(page: Page, label: ViewLabel): Promise<void> {
  const tab = pageBlock(page, 'S1').getByRole('tab', { name: label, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
}

/** 目前結果數（`data-testid="result-count"`「共 <N> 個事件」的 N）。 */
export async function resultCount(page: Page): Promise<number> {
  const text = normalizeText(await page.getByTestId('result-count').innerText());
  const match = /共(\d+)個事件/.exec(text);
  if (!match) throw new Error(`無法解析結果數：「${text}」`);
  return Number(match[1]);
}

const HAN = '\\p{Script=Han}';
const HAN_DIGIT_GAP = new RegExp(`(${HAN})\\s+(?=\\d)|(\\d)\\s+(?=${HAN})`, 'gu');

/**
 * 文案比對前的正規化（plan「Prototype 並列比對 E2E」）：
 * 連續空白（含換行）壓成一個空白、去頭尾空白，並移除中文與數字之間的空白（「共 54 個事件」≡「共54個事件」）。
 */
export function normalizeText(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .trim()
    .replace(HAN_DIGIT_GAP, (_m, han: string | undefined, digit: string | undefined) => han ?? digit ?? '');
}

/** 頁面沒有水平捲動（文件寬度不超出視窗寬度；SC-004、AC-S6）。 */
export async function hasNoHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const viewport = doc.clientWidth;
    return doc.scrollWidth <= viewport && document.body.scrollWidth <= viewport;
  });
}

/** 綁定 page 的工具集合，以 Playwright fixture `app` 提供。 */
export interface AppHelpers {
  goto(hash?: string): Promise<void>;
  block(key: PageKey): Locator;
  pickCharacter(name: string): Promise<void>;
  openCharacterInfo(name: string): Promise<void>;
  selectArc(name: string): Promise<void>;
  switchView(label: ViewLabel): Promise<void>;
  resultCount(): Promise<number>;
  hasNoHorizontalScroll(): Promise<boolean>;
}

export function appHelpers(page: Page): AppHelpers {
  return {
    goto: (hash) => gotoApp(page, hash),
    block: (key) => pageBlock(page, key),
    pickCharacter: (name) => pickCharacter(page, name),
    openCharacterInfo: (name) => openCharacterInfo(page, name),
    selectArc: (name) => selectArc(page, name),
    switchView: (label) => switchView(page, label),
    resultCount: () => resultCount(page),
    hasNoHorizontalScroll: () => hasNoHorizontalScroll(page),
  };
}

export const test = base.extend<{ app: AppHelpers }>({
  app: async ({ page }, provide) => {
    await provide(appHelpers(page));
  },
});
