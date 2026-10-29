/**
 * US1 瀏覽全書時間軸（T043；spec US1 驗收、contracts/ui-contracts.md S1／S2／S3）。
 *
 * 本檔 12 條：AC-01、AC-02、AC-P1、AC-P2、AC-P41、AC-P42、AC-S1、AC-S2、AC-S3、AC-S4、AC-S5、AC-S17。
 * AC-S6 於 Polish 的 e2e/responsive.spec.ts；AC-S13 需大節選單，於 US3 的 e2e/us3-arc-filter.spec.ts（T078）。
 *
 * 地圖／關係圖在 US1 為空的佔位區塊（`data-page="S5 地圖"`／`S6 關係圖`），沒有尺寸，
 * 故 AC-P41 以「區塊已掛載＋關係圖分頁 aria-selected＋時間軸未渲染」判定，不以 toBeVisible。
 */
import type { Page, Route } from '@playwright/test';
import {
  expect,
  gotoApp,
  hasNoHorizontalScroll,
  PAGES,
  pageBlock,
  resultCount,
  switchView,
  test,
} from './fixtures/app';

/** 資料檔請求（6 個 JSON；相對 baseURL，部署子路徑下同樣適用）。 */
const DATA_ROUTE = '**/data/*.json';

/** tokens.css 的 `--paper`：淺色 #eceee8、深色 #14181b（G-5、FR-020）。 */
const PAPER_LIGHT = 'rgb(236, 238, 232)';
const PAPER_DARK = 'rgb(20, 24, 27)';

function eventCard(page: Page, title: string) {
  return page.getByTestId('event-card').filter({ has: page.getByText(title, { exact: true }) });
}

test.describe('US1 timeline', () => {
  test('AC-01 all 54 events in chapter order, segmented by arcs', async ({ page }) => {
    await gotoApp(page);
    const timeline = page.getByTestId('timeline');
    await expect(timeline).toBeVisible();
    const cards = timeline.getByTestId('event-card');
    await expect(cards).toHaveCount(54);
    await expect(timeline.locator('.arcs button.arc')).toHaveCount(12);

    // 依章回排列：卡片的左緣隨起始回遞增（同起始回者左緣相同）
    const placed = await cards.evaluateAll((els) =>
      els.map((el) => {
        const text = (el.querySelector('.m')?.textContent ?? '').replace(/\s+/g, '');
        const m = /第(\d+)(?:–(\d+))?回/.exec(text);
        return { start: m ? Number(m[1]) : NaN, left: el.getBoundingClientRect().left };
      }),
    );
    expect(placed.every((p) => Number.isFinite(p.start))).toBe(true);
    const byStart = [...placed].sort((a, b) => a.start - b.start || a.left - b.left);
    for (let i = 1; i < byStart.length; i++) {
      const prev = byStart[i - 1]!;
      const cur = byStart[i]!;
      if (cur.start > prev.start) expect(cur.left).toBeGreaterThan(prev.left);
      else expect(Math.abs(cur.left - prev.left)).toBeLessThan(1);
    }
  });

  test('AC-02 clicking an event card opens its event detail', async ({ page }) => {
    await gotoApp(page);
    await expect(page.getByTestId('event-drawer')).toHaveCount(0);
    await eventCard(page, '智取生辰綱').click();
    const drawer = page.getByTestId('event-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-page', PAGES.S3);
    await expect(drawer).toHaveAttribute('aria-label', '事件明細');
  });

  test('AC-P1 result count shows 54 events and 12 arc bands', async ({ page }) => {
    await gotoApp(page);
    await expect(page.getByTestId('result-count')).toBeVisible();
    expect(await resultCount(page)).toBe(54);
    await expect(pageBlock(page, 'S2').locator('.arcs button.arc')).toHaveCount(12);
  });

  test('AC-P2 event detail title is the clicked event', async ({ page }) => {
    await gotoApp(page);
    await eventCard(page, '智取生辰綱').click();
    const drawer = pageBlock(page, 'S3');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('heading', { level: 2 })).toHaveText('智取生辰綱');
    // 類別字「事件 · <大節名>」（智取生辰綱屬第 2 大節）
    await expect(drawer.locator('.dh .k')).toHaveText(/^事件 · \S+/);
  });

  test('AC-P41 reloading on #graph stays on the graph view', async ({ page }) => {
    await gotoApp(page);
    await switchView(page, '關係圖');
    await expect(page).toHaveURL(/#graph$/);
    await page.reload();
    await page.locator('main').waitFor({ state: 'attached' });
    await expect(page).toHaveURL(/#graph$/);
    await expect(pageBlock(page, 'S1').getByRole('tab', { name: '關係圖', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(pageBlock(page, 'S6')).toHaveCount(1);
    await expect(pageBlock(page, 'S2')).toHaveCount(0);
  });

  test.describe('at 400px', () => {
    test.use({ viewport: { width: 400, height: 800 } });

    test('AC-P42 timeline becomes a vertical list without page horizontal scroll', async ({ page }) => {
      await gotoApp(page);
      await expect(page.getByTestId('timeline-list')).toBeVisible();
      await expect(page.getByTestId('timeline')).toHaveCount(0);
      await expect(page.getByTestId('timeline-list').getByTestId('event-card')).toHaveCount(54);
      expect(await hasNoHorizontalScroll(page)).toBe(true);
    });
  });

  test('AC-S1 overlapping events are staggered and never overlap', async ({ page }) => {
    await gotoApp(page);
    const cards = page.getByTestId('timeline').getByTestId('event-card');
    await expect(cards).toHaveCount(54);
    const boxes = await cards.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { l: r.left, t: r.top, r: r.right, b: r.bottom };
      }),
    );
    const overlaps: string[] = [];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        const intersects = a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
        if (intersects) overlaps.push(`${i}×${j}`);
      }
    }
    expect(overlaps).toEqual([]);
    // 確實有車道錯開（不只一列）
    expect(new Set(boxes.map((x) => Math.round(x.t))).size).toBeGreaterThan(1);
  });

  test('AC-S2 event with more than 3 characters shows 3 avatars and +N', async ({ page }) => {
    await gotoApp(page);
    // 智取生辰綱 收錄 6 位 → 3 個頭像＋「+3」
    const card = eventCard(page, '智取生辰綱');
    await expect(card.locator('.avs .av')).toHaveCount(3);
    await expect(card.locator('.more')).toHaveText('+3');
  });

  test('AC-S3 follows system dark and light color scheme', async ({ page }) => {
    const bodyBg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.emulateMedia({ colorScheme: 'dark' });
    await gotoApp(page);
    const dark = await bodyBg();
    await page.emulateMedia({ colorScheme: 'light' });
    const light = await bodyBg();
    expect(dark).toBe(PAPER_DARK);
    expect(light).toBe(PAPER_LIGHT);
    expect(dark).not.toBe(light);
  });

  test('AC-S4 shows a loading hint and no partial data while loading', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(DATA_ROUTE, async (route: Route) => {
      await gate;
      await route.continue();
    });
    await page.goto('./');
    await expect(page.getByTestId('loading')).toBeVisible();
    await expect(page.getByTestId('loading')).toHaveText('資料載入中…');
    await expect(page.getByTestId('event-card')).toHaveCount(0);
    await expect(page.locator('[data-page]')).toHaveCount(0);
    release();
    await expect(page.getByTestId('loading')).toHaveCount(0);
    expect(await resultCount(page)).toBe(54);
  });

  test('AC-S5 load failure shows error with retry, then 54 events after retry', async ({ page }) => {
    let fail = true;
    await page.route(DATA_ROUTE, async (route: Route) => {
      if (fail) await route.abort();
      else await route.continue();
    });
    await page.goto('./');
    const error = page.getByTestId('load-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText('資料載入失敗，請稍後再試。');
    await expect(page.getByTestId('event-card')).toHaveCount(0);
    await expect(page.locator('[data-page]')).toHaveCount(0);
    fail = false;
    await error.getByRole('button', { name: '重試' }).click();
    await expect(page.getByTestId('result-count')).toBeVisible();
    expect(await resultCount(page)).toBe(54);
    await expect(page.getByTestId('event-card')).toHaveCount(54);
  });

  test('AC-S17 missing or unknown hash shows the timeline view', async ({ page }) => {
    for (const hash of [undefined, 'foo']) {
      // 先離開本頁，確保每次都是完整載入（同頁只改 hash 不會重新初始化）
      await page.goto('about:blank');
      await gotoApp(page, hash);
      await expect(pageBlock(page, 'S2')).toBeVisible();
      await expect(pageBlock(page, 'S1').getByRole('tab', { name: '時間軸', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(pageBlock(page, 'S5')).toHaveCount(0);
      await expect(pageBlock(page, 'S6')).toHaveCount(0);
      await expect(page).toHaveURL(/#timeline$/);
    }
  });
});
