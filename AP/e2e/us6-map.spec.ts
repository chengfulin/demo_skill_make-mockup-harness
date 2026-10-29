/**
 * US6 地圖檢視事件地點（T117；spec US6 驗收、FR-015～FR-018、G-3、G-10、contracts/ui-contracts.md S5）。
 *
 * 本檔 14 條：AC-14、AC-15、AC-16、AC-P26、AC-P27、AC-P28、AC-P35、AC-P36、AC-P37、AC-P38、AC-P39、
 * AC-S10、AC-S11、AC-S23；另加「AC-P21（地圖端）」補驗 US4 未驗的標記高亮與側欄，
 * 以及窄螢幕（400px）地圖縮放在寬度內、側欄移到地圖下方（plan「主題與響應式」）。
 *
 * 定位：區塊 `data-page="S5 地圖"`；範圍分頁 `role=tablist[aria-label=地圖範圍]`；地圖框 `data-testid="map"`；
 * 側欄 `data-testid="map-side"`（`.panel` 兩個）；標記 `g.mk[role=button][aria-label="<地名>，<N> 個事件"]`
 * （焦點加 `.hi`）、標籤 `text.l`；山東框 `[aria-label=放大山東]`；行跡 `polyline.trail`、順序號 `.trailno`；
 * 刻度 `[aria-label=章回範圍]`（外層 `.mapruler`）。SVG 為 `role=img`，標記以 CSS 屬性定位，不依無障礙樹。
 */
import type { Locator, Page } from '@playwright/test';
import {
  expect,
  gotoApp,
  hasNoHorizontalScroll,
  normalizeText,
  pageBlock,
  pickCharacter,
  switchView,
  test,
} from './fixtures/app';

const map = (page: Page): Locator => page.getByTestId('map');
const side = (page: Page): Locator => page.getByTestId('map-side');
const markers = (page: Page): Locator => map(page).locator('g.mk');
const marker = (page: Page, name: string, n?: number): Locator =>
  n === undefined
    ? map(page).locator(`g.mk[data-place="${name}"]`)
    : map(page).locator(`g.mk[aria-label="${name}，${n} 個事件"]`);
const trail = (page: Page): Locator => map(page).locator('polyline.trail');
const scopeTab = (page: Page, label: '全圖' | '山東'): Locator =>
  pageBlock(page, 'S5').getByRole('tablist', { name: '地圖範圍' }).getByRole('tab', { name: label, exact: true });

/** 開地圖（可先選角色），等 S5 區塊出現 */
async function openMap(page: Page, names: string[] = []): Promise<void> {
  await gotoApp(page);
  for (const n of names) await pickCharacter(page, n);
  await switchView(page, '地圖');
  await expect(pageBlock(page, 'S5')).toBeVisible();
}

/** 行跡折線的頂點數 */
async function trailPointCount(page: Page): Promise<number> {
  const pts = (await trail(page).getAttribute('points')) ?? '';
  return pts.trim().split(/\s+/).filter(Boolean).length;
}

type Box = { name: string; x: number; y: number; width: number; height: number };

/** 標記標籤（text.l）的畫面外框 */
async function labelBoxes(page: Page): Promise<Box[]> {
  return map(page)
    .locator('g.mk text.l')
    .evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return { name: n.textContent ?? '', x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
}

/** 兩兩相交的標籤配對（容忍 0.5px 誤差） */
function overlaps(boxes: Box[]): string[] {
  const hits: string[] = [];
  const e = 0.5;
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.x + e < b.x + b.width && b.x + e < a.x + a.width && a.y + e < b.y + b.height && b.y + e < a.y + a.height)
        hits.push(`${a.name}/${b.name}`);
    }
  return hits;
}

/** 時間軸上開事件明細（點事件卡） */
async function openEventFromTimeline(page: Page, title: string): Promise<Locator> {
  await page
    .getByTestId('timeline')
    .getByTestId('event-card')
    .filter({ has: page.getByText(title, { exact: true }) })
    .click();
  const d = page.getByTestId('event-drawer');
  await expect(d.getByRole('heading', { level: 2 })).toHaveText(title);
  return d;
}

test.describe('US6 map view', () => {
  test('AC-14 only Wu Song: his place markers and a trail in chapter order', async ({ page }) => {
    await openMap(page, ['武松']);
    await expect(markers(page)).toHaveCount(8);
    await expect(trail(page)).toHaveCount(1);
    expect(await trailPointCount(page)).toBe(8);
    await expect(map(page).locator('.trailno')).toHaveText(['1', '2', '3', '4', '5', '6', '7']);
    await expect(side(page).locator('.panel').nth(1).getByRole('heading')).toHaveText('武松的行跡');
  });

  test('AC-15 two or more characters: markers but no trail', async ({ page }) => {
    await openMap(page, ['武松', '魯智深']);
    expect(await markers(page).count()).toBeGreaterThan(0);
    await expect(trail(page)).toHaveCount(0);
    await expect(side(page).locator('.panel').nth(1)).toContainText(
      '選了多位角色時只標出地點，不畫行跡線。只選一位角色可看行跡。',
    );
  });

  test('AC-16 Shandong via tab or box: 梁山泊, 祝家莊, 鄆城縣 labels do not overlap', async ({ page }) => {
    await openMap(page);
    await scopeTab(page, '山東').click();
    await expect(scopeTab(page, '山東')).toHaveAttribute('aria-selected', 'true');
    let boxes = (await labelBoxes(page)).filter((b) => ['梁山泊', '祝家莊', '鄆城縣'].includes(b.name));
    expect(boxes).toHaveLength(3);
    expect(overlaps(boxes)).toEqual([]);

    await scopeTab(page, '全圖').click();
    await map(page).getByText('山東 · 點此放大').click();
    await expect(scopeTab(page, '山東')).toHaveAttribute('aria-selected', 'true');
    boxes = (await labelBoxes(page)).filter((b) => ['梁山泊', '祝家莊', '鄆城縣'].includes(b.name));
    expect(boxes).toHaveLength(3);
    expect(overlaps(boxes)).toEqual([]);
  });

  test('AC-P26 only Wu Song: 8 markers and 1 trail line', async ({ page }) => {
    await openMap(page, ['武松']);
    await expect(markers(page)).toHaveCount(8);
    await expect(trail(page)).toHaveCount(1);
  });

  test('AC-P27 Wu Song then Song Jiang: no trail, "1 個事件無法標示地點"', async ({ page }) => {
    await openMap(page, ['武松']);
    await expect(trail(page)).toHaveCount(1);
    await pickCharacter(page, '宋江');
    await expect(trail(page)).toHaveCount(0);
    await expect(map(page).locator('.unloc')).toHaveText('1 個事件無法標示地點');
  });

  test('AC-P28 Wu Song + Song Jiang, click 江州: side lists its 3 events', async ({ page }) => {
    await openMap(page, ['武松', '宋江']);
    // 點圓（g 的外框中心可能落在標籤字形間的空白，會點到底圖）
    await marker(page, '江州', 3).locator('circle.o').click();
    const panel = side(page).locator('.panel').first();
    await expect(panel.getByRole('heading')).toHaveText('江州');
    await expect(panel).toContainText('3 個事件');
    await expect(panel.getByRole('button')).toHaveCount(3);
    await expect(panel.locator('b')).toHaveText(['江州結識戴宗・李逵', '潯陽樓吟反詩', '江州劫法場']);
  });

  test('AC-P35 no filter: defaults to 全圖 with the dashed Shandong box', async ({ page }) => {
    await openMap(page);
    await expect(scopeTab(page, '全圖')).toHaveAttribute('aria-selected', 'true');
    await expect(scopeTab(page, '山東')).toHaveAttribute('aria-selected', 'false');
    await expect(map(page).getByRole('img', { name: '北宋疆域示意地圖' })).toBeVisible();
    await expect(map(page).locator('[aria-label="放大山東"]')).toBeVisible();
    await expect(map(page).getByText('山東 · 點此放大')).toBeVisible();
    await expect(markers(page)).toHaveCount(32);
  });

  test('AC-P36 clicking "山東 · 點此放大" shows 15 places without 東京', async ({ page }) => {
    await openMap(page);
    await map(page).getByText('山東 · 點此放大').click();
    await expect(scopeTab(page, '山東')).toHaveAttribute('aria-selected', 'true');
    await expect(map(page).locator('svg[aria-label="山東範圍示意地圖"]')).toBeVisible();
    await expect(markers(page)).toHaveCount(15);
    await expect(marker(page, '東京')).toHaveCount(0);
    await expect(map(page).locator('[aria-label="放大山東"]')).toHaveCount(0);
  });

  test('AC-P37 Shandong, no filter: no two place labels overlap', async ({ page }) => {
    await openMap(page);
    await scopeTab(page, '山東').click();
    await expect(markers(page)).toHaveCount(15);
    const boxes = await labelBoxes(page);
    expect(boxes).toHaveLength(15);
    expect(overlaps(boxes)).toEqual([]);
  });

  test('AC-P38 in Shandong, pick Wu Song: 4 markers and 1 trail line', async ({ page }) => {
    await openMap(page);
    await scopeTab(page, '山東').click();
    await pickCharacter(page, '武松');
    await expect(scopeTab(page, '山東')).toHaveAttribute('aria-selected', 'true');
    await expect(markers(page)).toHaveCount(4);
    await expect(trail(page)).toHaveCount(1);
  });

  test('AC-P39 chapter ruler sits right below the map with the same width', async ({ page }) => {
    await openMap(page);
    const mapBox = await map(page).boundingBox();
    const ruler = pageBlock(page, 'S5').getByLabel('章回範圍');
    const rulerBox = await ruler.boundingBox();
    expect(mapBox).not.toBeNull();
    expect(rulerBox).not.toBeNull();
    if (!mapBox || !rulerBox) return;
    // 正下方：刻度頂端在地圖底端之下，間距不超過一個區塊間隔（含刻度上方留白）
    expect(rulerBox.y).toBeGreaterThanOrEqual(mapBox.y + mapBox.height - 0.5);
    expect(rulerBox.y - (mapBox.y + mapBox.height)).toBeLessThan(24);
    // 同寬：左右緣對齊（容忍邊框與 2px 內距）
    expect(Math.abs(rulerBox.x - mapBox.x)).toBeLessThanOrEqual(4);
    expect(Math.abs(rulerBox.width - mapBox.width)).toBeLessThanOrEqual(6);
    await expect(pageBlock(page, 'S5').locator('.mapruler')).toContainText(
      '章回刻度 · 第 1–120 回，共 54 個事件，直線標出各事件的起始回',
    );
    await expect(ruler.locator('.lb')).toHaveText(['1', '30', '60', '90', '120']);
  });

  test('AC-S10 trail merges consecutive same-place events and skips unlocated ones', async ({ page }) => {
    // 宋江：鄆城縣×2、江州×3、梁山泊連續各合併；「九天玄女授天書」（還道村）無法定位不列入 → 16 點、15 段
    await openMap(page, ['宋江']);
    await expect(trail(page)).toHaveCount(1);
    expect(await trailPointCount(page)).toBe(16);
    await expect(map(page).locator('.trailno')).toHaveCount(15);
    await expect(map(page).locator('.unloc')).toHaveText('1 個事件無法標示地點');
  });

  test('AC-S11 the map is marked "示意，非精確測繪"', async ({ page }) => {
    await openMap(page);
    await expect(map(page).locator('.mapnote')).toHaveText('示意，非精確測繪');
    await scopeTab(page, '山東').click();
    await expect(map(page).locator('.mapnote')).toHaveText('示意，非精確測繪 · 山東範圍外的地點不顯示');
  });

  test('AC-S23 from Shandong, "孟州 · 在地圖上看" switches back to 全圖 and highlights 孟州', async ({ page }) => {
    await openMap(page);
    await scopeTab(page, '山東').click();
    await expect(scopeTab(page, '山東')).toHaveAttribute('aria-selected', 'true');
    await switchView(page, '時間軸');
    const d = await openEventFromTimeline(page, '醉打蔣門神・血濺鴛鴦樓');
    await d.getByRole('button', { name: '孟州 · 在地圖上看', exact: true }).click();
    await expect(page).toHaveURL(/#map$/);
    await expect(scopeTab(page, '全圖')).toHaveAttribute('aria-selected', 'true');
    await expect(marker(page, '孟州')).toHaveClass(/\bhi\b/);
  });

  test('AC-P21 (map side) place from event detail is highlighted and listed in the side panel', async ({ page }) => {
    await gotoApp(page);
    const d = await openEventFromTimeline(page, '大鬧野豬林');
    await d.getByRole('button', { name: '野豬林 · 在地圖上看', exact: true }).click();
    await expect(page).toHaveURL(/#map$/);
    await expect(marker(page, '野豬林')).toHaveClass(/\bhi\b/);
    const others = map(page).locator('g.mk.hi');
    await expect(others).toHaveCount(1);
    const panel = side(page).locator('.panel').first();
    await expect(panel.getByRole('heading')).toHaveText('野豬林');
    await expect(panel.locator('b')).toHaveText(['大鬧野豬林']);
  });

  test.describe('narrow screen (400px)', () => {
    test.use({ viewport: { width: 400, height: 800 } });

    test('map scales within the width and the side panel moves below the map', async ({ page }) => {
      await openMap(page);
      const vw = 400;
      const svg = await map(page).locator('svg').boundingBox();
      expect(svg).not.toBeNull();
      if (!svg) return;
      expect(svg.x).toBeGreaterThanOrEqual(0);
      expect(svg.x + svg.width).toBeLessThanOrEqual(vw);
      const sideBox = await side(page).boundingBox();
      const rulerBox = await pageBlock(page, 'S5').locator('.mapruler').boundingBox();
      expect(sideBox && rulerBox && sideBox.y >= rulerBox.y + rulerBox.height - 0.5).toBe(true);
      expect(await hasNoHorizontalScroll(page)).toBe(true);
      expect(normalizeText(await map(page).locator('.mapnote').innerText())).toBe('示意，非精確測繪');
    });
  });
});
