/**
 * US5 檢視角色資料與狀態（T101；spec US5 驗收、FR-013、FR-014、G-10、contracts/ui-contracts.md S1／S4）。
 *
 * 本檔 10 條：AC-12、AC-13、AC-P22、AC-P23、AC-P24、AC-P25、AC-S12、AC-S16、AC-S24、AC-S25。
 * AC-S15（自角色資料開啟不在篩選結果中的事件）於 e2e/us4-prevnext-from-character.spec.ts（T102）。
 *
 * 定位：面板 `data-testid="character-drawer"`（data-page「S4 角色資料面板」）、事件明細 `data-testid="event-drawer"`；
 * 入口為 chip 的資料鈕（fixture `openCharacterInfo`，aria-label「<姓名> 角色資料」）；
 * 狀態條為面板內 `role="img"`（aria-label「未登場 13 回，在野 6 回，…」）；區塊依小標 h4；
 * 身分區中繼列 `.meta`；遮罩 `.scrim`（面板寬 min(440px, 100%) 靠右，點左上角即落在遮罩上）。
 */
import type { Locator, Page } from '@playwright/test';
import {
  characterPickButton,
  expect,
  gotoApp,
  normalizeText,
  openCharacterInfo,
  pickCharacter,
  resultCount,
  test,
} from './fixtures/app';

function characterDrawer(page: Page): Locator {
  return page.getByTestId('character-drawer');
}

function eventDrawer(page: Page): Locator {
  return page.getByTestId('event-drawer');
}

/** 開某角色資料，並等面板標題為該角色 */
async function openInfo(page: Page, name: string): Promise<Locator> {
  await openCharacterInfo(page, name);
  const d = characterDrawer(page);
  await expect(d).toHaveAttribute('data-page', 'S4 角色資料面板');
  await expect(d.getByRole('heading', { level: 2 })).toHaveText(name);
  return d;
}

function statusBar(d: Locator): Locator {
  return d.getByRole('img');
}

/** 身分區中繼列（正規化後文字） */
async function identityMeta(d: Locator): Promise<string> {
  return normalizeText(await d.locator('.meta').first().innerText());
}

/** 面板內依小標取區塊（`.sec`） */
function section(d: Locator, heading: string | RegExp): Locator {
  return d.locator('.sec', { has: d.page().getByRole('heading', { name: heading }) });
}

/** 已選列標籤（依「移除 <姓名>」鈕的 aria-label，依畫面順序） */
async function tagNames(page: Page): Promise<string[]> {
  const labels = await page
    .getByTestId('selected-bar')
    .getByRole('button', { name: /^移除 / })
    .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''));
  return labels.map((l) => l.replace(/^移除 /, ''));
}

/** 已選 chip 的姓名 */
async function pressedNames(page: Page): Promise<string[]> {
  return (
    await page.getByTestId('char-list').locator('button.pick[aria-pressed="true"] .nm').allTextContents()
  ).map((s) => s.trim());
}

/** 點遮罩（面板外的左上角） */
async function clickScrim(page: Page): Promise<void> {
  await page.locator('.scrim').click({ position: { x: 20, y: 20 } });
}

test.beforeEach(async ({ page }) => {
  await gotoApp(page, 'timeline');
});

test('AC-12 晁蓋: 已死亡或離散 from the 曾頭市 chapter (60) on, labelled 非一百單八將', async ({ page }) => {
  const d = await openInfo(page, '晁蓋');
  const label = (await statusBar(d).getAttribute('aria-label')) ?? '';
  // 第 60 回（晁天王曾頭市中箭）起到第 120 回共 61 回為已死亡或離散，且為最後一段
  expect(label.endsWith('已死亡或離散 61 回')).toBe(true);
  await expect(d.locator('.stmk', { hasText: '結局 60' })).toBeVisible();
  expect(await identityMeta(d)).toContain('非一百單八將');
});

test('AC-13 林沖: clicking 魯智深 in relations switches the drawer to 魯智深', async ({ page }) => {
  const d = await openInfo(page, '林沖');
  await section(d, '人物關係').getByRole('button', { name: /魯智深/ }).click();
  await expect(d.getByRole('heading', { level: 2 })).toHaveText('魯智深');
});

test('AC-P22 晁蓋 status bar: 未登場 13 / 在野 6 / 已上梁山 40 / 已死亡或離散 61, 非一百單八將', async ({ page }) => {
  const d = await openInfo(page, '晁蓋');
  await expect(statusBar(d)).toHaveAttribute(
    'aria-label',
    '未登場 13 回，在野 6 回，已上梁山 40 回，已死亡或離散 61 回',
  );
  expect(await identityMeta(d)).toContain('非一百單八將');
});

test('AC-P23 高俅 status bar has only 未登場 1 and 在野 119', async ({ page }) => {
  const d = await openInfo(page, '高俅');
  await expect(statusBar(d)).toHaveAttribute('aria-label', '未登場 1 回，在野 119 回');
  await expect(d.locator('.stmk')).toHaveText(['登場 2']);
});

test('AC-P24 林沖 → relation 魯智深: drawer shows 魯智深 data', async ({ page }) => {
  const d = await openInfo(page, '林沖');
  await section(d, '人物關係').getByRole('button', { name: /魯智深/ }).click();
  await expect(d.getByRole('heading', { level: 2 })).toHaveText('魯智深');
  expect(await identityMeta(d)).toContain(normalizeText('天孤星・第 13 位・天罡'));
  await expect(section(d, /^參與事件（/).getByRole('heading')).toHaveText('參與事件（10）');
  await expect(characterDrawer(page)).toHaveCount(1);
});

test('AC-P25 魯智深 「只看此角色」 leaves only 魯智深 selected', async ({ page }) => {
  await pickCharacter(page, '林沖');
  await pickCharacter(page, '武松');
  const d = await openInfo(page, '魯智深');
  await d.getByRole('button', { name: '只看此角色', exact: true }).click();
  expect(await tagNames(page)).toEqual(['魯智深']);
  expect(await pressedNames(page)).toEqual(['魯智深']);
});

test('AC-S12 clicking 林沖 info opens his data without changing selection', async ({ page }) => {
  const pick = characterPickButton(page, '林沖');
  await expect(pick).toHaveAttribute('aria-pressed', 'false');
  await openInfo(page, '林沖');
  await expect(pick).toHaveAttribute('aria-pressed', 'false');
  // 已選狀態下點「i」同樣不改變選取
  await page.keyboard.press('Escape');
  await expect(characterDrawer(page)).toHaveCount(0);
  await pickCharacter(page, '林沖');
  await openInfo(page, '林沖');
  await expect(pick).toHaveAttribute('aria-pressed', 'true');
});

test('AC-S16 公孫勝: 已死亡或離散 from fate chapter 110, last segment is not 已上梁山', async ({ page }) => {
  const d = await openInfo(page, '公孫勝');
  const label = (await statusBar(d).getAttribute('aria-label')) ?? '';
  const segments = label.split('，');
  expect(segments[segments.length - 1]).toBe('已死亡或離散 11 回');
  expect(segments[segments.length - 1]).not.toMatch(/^已上梁山/);
  await expect(d.locator('.stmk', { hasText: '結局 110' })).toBeVisible();
});

test('AC-S24 Escape and scrim close both the event drawer and the character drawer', async ({ page }) => {
  const card = page
    .getByTestId('timeline')
    .getByTestId('event-card')
    .filter({ has: page.getByText('大鬧野豬林', { exact: true }) });

  // 事件明細：Escape
  await card.click();
  await expect(eventDrawer(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(eventDrawer(page)).toHaveCount(0);
  // 事件明細：點遮罩
  await card.click();
  await expect(eventDrawer(page)).toBeVisible();
  await clickScrim(page);
  await expect(eventDrawer(page)).toHaveCount(0);

  // 角色資料：Escape
  await openInfo(page, '林沖');
  await page.keyboard.press('Escape');
  await expect(characterDrawer(page)).toHaveCount(0);
  // 角色資料：點遮罩
  await openInfo(page, '林沖');
  await clickScrim(page);
  await expect(characterDrawer(page)).toHaveCount(0);
});

test('AC-S25 「只看此角色」 closes the drawer, leaves only 魯智深, 10 events', async ({ page }) => {
  await pickCharacter(page, '林沖');
  const d = await openInfo(page, '魯智深');
  await d.getByRole('button', { name: '只看此角色', exact: true }).click();
  await expect(characterDrawer(page)).toHaveCount(0);
  await expect(page.locator('[data-page="S4 角色資料面板"]')).toHaveCount(0);
  expect(await tagNames(page)).toEqual(['魯智深']);
  expect(await resultCount(page)).toBe(10);
});
