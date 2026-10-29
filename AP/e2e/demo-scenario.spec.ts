/**
 * 展示情境（T142；spec SC-002、SC-004、FR-020、D-6；StoryBoard「展示情境」6 步）。
 *
 * 6 步在同一頁面依序完成、不重新整理：
 *   1. 進站看全書時間軸「共 54 個事件」
 *   2. 搜尋「豹子頭」Enter 選取林沖
 *   3. 開「大鬧野豬林」事件明細，點魯智深頭像加入篩選
 *   4. 點林沖名字開角色資料，看狀態條
 *   5. 「只看此角色」後切地圖看林沖行跡
 *   6. 切關係圖，點魯智深節點開角色資料
 * 「不重新整理」以 window 上的標記驗證：進站後設下，最後一步仍在（重新載入會清掉）。
 *
 * 測試標題含 `@demo`，供 `npm run e2e:browsers`（WebKit／Firefox／Edge）抽驗；
 * 另以 400×800 再跑同樣 6 步（SC-004「操作可完成」）。
 *
 * 定位：搜尋框 role=searchbox「搜尋角色」；事件卡 `data-testid="event-card"`；事件明細 `data-testid="event-drawer"`
 * （頭像鈕 aria-label「將 <姓名> 加入篩選」、名字鈕 `button.nmb`）；角色資料 `data-testid="character-drawer"`
 * （狀態條 role=img）；地圖行跡 `polyline.trail`、側欄 `data-testid="map-side"`；關係圖節點圓 `[aria-label="<姓名> 角色資料"]`。
 */
import type { Page } from '@playwright/test';
import {
  characterPickButton,
  expect,
  gotoApp,
  normalizeText,
  pageBlock,
  resultCount,
  switchView,
  test,
} from './fixtures/app';

const RELOAD_MARK = '__demoNoReload';

/** 已選列標籤（依「移除 <姓名>」鈕的 aria-label，依畫面順序）；搜尋框仍留「豹子頭」時角色清單只剩林沖，故以已選列判定 */
async function tagNames(page: Page): Promise<string[]> {
  const labels = await page
    .getByTestId('selected-bar')
    .getByRole('button', { name: /^移除 / })
    .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''));
  return labels.map((l) => l.replace(/^移除 /, ''));
}

async function runDemo(page: Page): Promise<void> {
  // 1. 進站：全書時間軸，共 54 個事件
  await gotoApp(page);
  await page.evaluate((key) => {
    (window as unknown as Record<string, unknown>)[key] = true;
  }, RELOAD_MARK);
  expect(normalizeText(await page.getByTestId('result-count').innerText())).toBe('共54個事件');
  expect(await resultCount(page)).toBe(54);

  // 2. 搜尋「豹子頭」Enter 選取林沖：只剩林沖的事件
  const search = pageBlock(page, 'S1').getByRole('searchbox', { name: '搜尋角色' });
  await search.fill('豹子頭');
  await search.press('Enter');
  await expect(characterPickButton(page, '林沖')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => resultCount(page)).toBe(10);

  // 3. 開「大鬧野豬林」，點魯智深頭像加入篩選：兩人事件聯集
  await pageBlock(page, 'S2')
    .getByTestId('event-card')
    .filter({ has: page.getByText('大鬧野豬林', { exact: true }) })
    .click();
  const eventDrawer = page.getByTestId('event-drawer');
  await expect(eventDrawer.getByRole('heading', { level: 2 })).toHaveText('大鬧野豬林');
  await eventDrawer.getByRole('button', { name: '將 魯智深 加入篩選', exact: true }).click();
  await expect.poll(() => tagNames(page)).toEqual(['林沖', '魯智深']);
  await expect.poll(() => resultCount(page)).toBe(16);

  // 4. 點林沖名字開角色資料：狀態條由在野、上梁山到結局
  await eventDrawer.locator('button.nmb', { hasText: '林沖' }).click();
  const characterDrawer = page.getByTestId('character-drawer');
  await expect(characterDrawer.getByRole('heading', { level: 2 })).toHaveText('林沖');
  const status = (await characterDrawer.getByRole('img').getAttribute('aria-label')) ?? '';
  // 林沖：登場 7、上梁山 11、結局 119（public/data/characters.json；FR-013）
  expect(status).toBe('未登場 6 回，在野 4 回，已上梁山 108 回，已死亡或離散 2 回');

  // 5. 「只看此角色」→ 切地圖：林沖的行跡線
  await characterDrawer.getByRole('button', { name: '只看此角色', exact: true }).click();
  await expect(characterDrawer).toHaveCount(0);
  await expect.poll(() => tagNames(page)).toEqual(['林沖']);
  await switchView(page, '地圖');
  await expect(pageBlock(page, 'S5')).toBeVisible();
  await expect(page.getByTestId('map').locator('polyline.trail')).toHaveCount(1);
  await expect(page.getByTestId('map-side').locator('.panel').nth(1).getByRole('heading')).toHaveText(
    '林沖的行跡',
  );

  // 6. 切關係圖，點魯智深節點開其角色資料
  await switchView(page, '關係圖');
  await expect(pageBlock(page, 'S6')).toBeVisible();
  await page.getByTestId('graph').locator('circle[role="button"][aria-label="魯智深 角色資料"]').click();
  await expect(characterDrawer.getByRole('heading', { level: 2 })).toHaveText('魯智深');

  // 全程未重新整理
  expect(
    await page.evaluate((key) => (window as unknown as Record<string, unknown>)[key] === true, RELOAD_MARK),
  ).toBe(true);
}

test.describe('SC-002 demo scenario', () => {
  test('@demo SC-002 six demo steps complete in one page session without reload', async ({ page }) => {
    await runDemo(page);
  });

  test.describe('at 400x800', () => {
    test.use({ viewport: { width: 400, height: 800 } });

    test('@demo SC-004 six demo steps complete at 400x800 without reload', async ({ page }) => {
      await runDemo(page);
    });
  });
});
