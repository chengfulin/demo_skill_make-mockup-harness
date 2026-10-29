/**
 * 響應式（T141；spec US2 驗收 AC-S6、FR-020、SC-004、Clarifications「手機 400px」、contracts/ui-contracts.md S3／S4／S5／S6）。
 *
 * 本檔：AC-S6（400×800 依序切地圖、關係圖並開事件明細與角色資料）；
 * SC-004（1440×900 與 400×800 下三個視圖與兩種面板，頁面本身皆無水平捲動）。
 *
 * 「縮放在寬度內」依 Clarifications：Prototype 定義為縮放到寬度內，容器內橫向捲動為退路——
 * 故判定為「圖框不超出視窗，且 SVG 在視窗寬度內，或圖框內可自身橫向捲動」；頁面本身一律不得水平捲動。
 * 「全寬底部抽屜」：面板左緣 0、寬度＝視窗寬、底緣貼齊視窗底、頂緣低於視窗頂（≤720px，Drawer.css）。
 *
 * 定位：視圖分頁與區塊依 fixture（`switchView`、`pageBlock`）；地圖框 `data-testid="map"`、側欄 `data-testid="map-side"`、
 * 標記 `g.mk[data-place]`；關係圖框 `data-testid="graph"`、節點圓 `[aria-label="<姓名> 角色資料"]`；
 * 面板 `data-testid="event-drawer"`／`character-drawer`。
 */
import type { Locator, Page } from '@playwright/test';
import {
  expect,
  gotoApp,
  hasNoHorizontalScroll,
  openCharacterInfo,
  pageBlock,
  switchView,
  test,
} from './fixtures/app';

const NARROW = { width: 400, height: 800 };

const eventDrawer = (page: Page): Locator => page.getByTestId('event-drawer');
const characterDrawer = (page: Page): Locator => page.getByTestId('character-drawer');

/** 視窗尺寸（以 viewportSize 為準，不依 window.innerWidth 以免含捲軸寬） */
function viewport(page: Page): { width: number; height: number } {
  const size = page.viewportSize();
  if (!size) throw new Error('沒有 viewport 尺寸');
  return size;
}

/** 面板為全寬底部抽屜：左緣 0、寬＝視窗寬、底緣貼視窗底、頂緣在視窗頂之下 */
async function expectBottomSheet(page: Page, drawer: Locator): Promise<void> {
  const { width, height } = viewport(page);
  const box = await drawer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  expect(Math.abs(box.x)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(box.width - width)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(box.y + box.height - height)).toBeLessThanOrEqual(0.5);
  expect(box.y).toBeGreaterThan(0);
}

/**
 * 圖框（地圖／關係圖）縮放在寬度內：圖框不超出視窗；其中 SVG 在視窗寬度內，
 * 或（退路）SVG 所在的某層容器（圖框以內）可自身橫向捲動。
 */
async function expectFitsWidth(page: Page, frame: Locator): Promise<void> {
  const { width } = viewport(page);
  const frameBox = await frame.boundingBox();
  expect(frameBox).not.toBeNull();
  if (!frameBox) return;
  expect(frameBox.x).toBeGreaterThanOrEqual(-0.5);
  expect(frameBox.x + frameBox.width).toBeLessThanOrEqual(width + 0.5);

  const svg = frame.locator('svg[role="img"]').first();
  const result = await svg.evaluate((el, vw) => {
    const r = el.getBoundingClientRect();
    const inside = r.left >= -0.5 && r.right <= vw + 0.5;
    const frameEl = el.closest('[data-testid]');
    let scrollable = false;
    for (let node = el.parentElement; node; node = node.parentElement) {
      const ox = getComputedStyle(node).overflowX;
      if ((ox === 'auto' || ox === 'scroll') && node.scrollWidth > node.clientWidth) scrollable = true;
      if (node === frameEl) break;
    }
    return { inside, scrollable };
  }, width);
  expect(result.inside || result.scrollable).toBe(true);
}

test.describe('AC-S6 at 400x800', () => {
  test.use({ viewport: NARROW });

  test('AC-S6 map and graph fit the width, both drawers are full-width bottom sheets, no page h-scroll', async ({
    page,
  }) => {
    await gotoApp(page);
    expect(await hasNoHorizontalScroll(page)).toBe(true);

    // 切到地圖：地圖縮放在寬度內
    await switchView(page, '地圖');
    await expect(pageBlock(page, 'S5')).toBeVisible();
    await expectFitsWidth(page, page.getByTestId('map'));
    expect(await hasNoHorizontalScroll(page)).toBe(true);

    // 地圖上開事件明細（點標記 → 側欄事件）：全寬底部抽屜
    await page.getByTestId('map').locator('g.mk[data-place="江州"] circle.o').click();
    const placePanel = page.getByTestId('map-side').locator('.panel').first();
    await expect(placePanel.getByRole('heading')).toHaveText('江州');
    await placePanel.getByRole('button').first().click();
    await expect(eventDrawer(page)).toBeVisible();
    await expectBottomSheet(page, eventDrawer(page));
    expect(await hasNoHorizontalScroll(page)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(eventDrawer(page)).toHaveCount(0);

    // 切到關係圖：縮放在寬度內
    await switchView(page, '關係圖');
    await expect(pageBlock(page, 'S6')).toBeVisible();
    await expectFitsWidth(page, page.getByTestId('graph'));
    expect(await hasNoHorizontalScroll(page)).toBe(true);

    // 關係圖上開角色資料（點宋江節點）：全寬底部抽屜
    await page.getByTestId('graph').locator('circle[role="button"][aria-label="宋江 角色資料"]').click();
    await expect(characterDrawer(page)).toBeVisible();
    await expect(characterDrawer(page).getByRole('heading', { level: 2 })).toHaveText('宋江');
    await expectBottomSheet(page, characterDrawer(page));
    expect(await hasNoHorizontalScroll(page)).toBe(true);
  });
});

/** 三個視圖與兩種面板逐一檢查頁面無水平捲動（SC-004） */
async function checkAllViewsAndDrawers(page: Page): Promise<void> {
  await gotoApp(page);

  await switchView(page, '時間軸');
  await expect(pageBlock(page, 'S2')).toBeVisible();
  expect(await hasNoHorizontalScroll(page), '時間軸').toBe(true);

  // 事件明細（自時間軸第一張事件卡開啟）
  await pageBlock(page, 'S2').getByTestId('event-card').first().click();
  await expect(eventDrawer(page)).toBeVisible();
  expect(await hasNoHorizontalScroll(page), '事件明細').toBe(true);
  await page.keyboard.press('Escape');
  await expect(eventDrawer(page)).toHaveCount(0);

  // 角色資料（自角色清單的資料鈕開啟）
  await openCharacterInfo(page, '林沖');
  expect(await hasNoHorizontalScroll(page), '角色資料').toBe(true);
  await page.keyboard.press('Escape');
  await expect(characterDrawer(page)).toHaveCount(0);

  await switchView(page, '地圖');
  await expect(pageBlock(page, 'S5')).toBeVisible();
  expect(await hasNoHorizontalScroll(page), '地圖').toBe(true);

  await switchView(page, '關係圖');
  await expect(pageBlock(page, 'S6')).toBeVisible();
  expect(await hasNoHorizontalScroll(page), '關係圖').toBe(true);
}

test.describe('SC-004 no page horizontal scroll', () => {
  test('SC-004 at 1440x900: three views and both drawers', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await checkAllViewsAndDrawers(page);
  });

  test.describe('narrow', () => {
    test.use({ viewport: NARROW });

    test('SC-004 at 400x800: three views and both drawers', async ({ page }) => {
      await checkAllViewsAndDrawers(page);
    });
  });
});
