/**
 * US7 角色關係網絡圖（T131；spec US7 驗收、FR-004、FR-019、D-1、D-4、G-9、contracts/ui-contracts.md S6）。
 *
 * 本檔 10 條：AC-17、AC-18、AC-P29、AC-P30、AC-P31、AC-P32、AC-P40、AC-S18、AC-S20、AC-S22。
 *
 * 定位：區塊 `data-page="S6 關係圖"`；圖框 `data-testid="graph"`；SVG `role=img[aria-label=角色關係圖]`；
 * 節點 `g.node[data-node]`（淡出 `data-dim="true"`、已選 `data-selected`），節點圓 `[aria-label="<姓名> 角色資料"]`、
 * 「＋」`[aria-label="將 <姓名> 加入篩選"]`；邊 `g.edge`；圖例 `.glegend`（最後一項為說明文字）。
 * SVG 為 `role=img`，節點以 CSS 屬性定位，不依無障礙樹。
 * 截圖對照：S6-01-未選角色以宋江為中心、S6-02-選林沖一層關係、S6-03-點節點開角色資料。
 */
import type { Locator, Page } from '@playwright/test';
import {
  characterPickButton,
  expect,
  gotoApp,
  normalizeText,
  pageBlock,
  pickCharacter,
  resultCount,
  selectArc,
  switchView,
  test,
} from './fixtures/app';

const graph = (page: Page): Locator => page.getByTestId('graph');
const nodes = (page: Page): Locator => graph(page).locator('g.node');
const dimmed = (page: Page): Locator => graph(page).locator('g.node[data-dim="true"]');
const clearNodes = (page: Page): Locator => graph(page).locator('g.node:not([data-dim="true"])');
const nodeCircle = (page: Page, name: string): Locator =>
  graph(page).locator(`circle[role="button"][aria-label="${name} 角色資料"]`);
/** 某角色的節點群組（`has` 需用相對於節點的 locator，不能自 graph 起算） */
const nodeOf = (page: Page, name: string): Locator =>
  nodes(page).filter({ has: page.locator(`circle[aria-label="${name} 角色資料"]`) });
const plus = (page: Page, name: string): Locator =>
  graph(page).locator(`[role="button"][aria-label="將 ${name} 加入篩選"]`);
const legend = (page: Page): Locator => graph(page).locator('.glegend');
const caption = (page: Page): Locator => legend(page).locator('> :last-child');

const FULL_CAPTION = '點人物看資料，點「＋」加入篩選；未選角色時以宋江為中心';
const SHORT_CAPTION = '點人物看資料，點「＋」加入篩選';

/** 開關係圖（可先選角色），等 S6 區塊出現 */
async function openGraph(page: Page, names: string[] = []): Promise<void> {
  await gotoApp(page);
  for (const n of names) await pickCharacter(page, n);
  await switchView(page, '關係圖');
  await expect(pageBlock(page, 'S6')).toBeVisible();
  await expect(page).toHaveURL(/#graph$/);
}

/** 清楚節點的姓名（依 DOM 順序後排序） */
async function clearNames(page: Page): Promise<string[]> {
  return (await clearNodes(page).locator('text.nm').allTextContents()).map((s) => s.trim()).sort();
}

/** 節點圓心在螢幕上的位置（等 transition 結束後量） */
async function centerOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('節點不可見');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** SVG 的畫面中心（viewBox 置中縮放） */
async function svgCenter(page: Page): Promise<{ x: number; y: number }> {
  return centerOf(graph(page).getByRole('img', { name: '角色關係圖' }));
}

async function expectAtCenter(page: Page, name: string): Promise<void> {
  await expect
    .poll(async () => {
      const c = await centerOf(nodeCircle(page, name));
      const s = await svgCenter(page);
      return Math.hypot(c.x - s.x, c.y - s.y);
    })
    .toBeLessThan(2);
}

test.describe('US7 relation graph', () => {
  test('AC-17 none selected: all characters, all relation edges and the legend', async ({ page }) => {
    await openGraph(page);
    await expect(graph(page).getByRole('img', { name: '角色關係圖' })).toBeVisible();
    await expect(nodes(page)).toHaveCount(22);
    await expect(graph(page).locator('g.edge')).toHaveCount(13);
    await expect(graph(page).locator('g.edge.dim')).toHaveCount(0);
    await expect(legend(page)).toBeVisible();
    const text = normalizeText(await legend(page).innerText());
    for (const t of ['天罡', '地煞', '其他', '結義', '主僕', '兄弟', '夫妻', '仇敵']) expect(text).toContain(t);
  });

  test('AC-18 林沖 selected: 林沖 centered, only directly related characters clear', async ({ page }) => {
    await openGraph(page, ['林沖']);
    await expectAtCenter(page, '林沖');
    expect(await clearNames(page)).toEqual(['林沖', '魯智深', '高俅'].sort());
    await expect(nodeOf(page, '林沖')).toHaveAttribute('data-selected', 'true');
  });

  test('AC-P29 none selected: 22 nodes, none dimmed, legend present', async ({ page }) => {
    await openGraph(page);
    await expect(nodes(page)).toHaveCount(22);
    await expect(dimmed(page)).toHaveCount(0);
    await expect(legend(page)).toBeVisible();
  });

  test('AC-P30 林沖 selected: centered, clear = 林沖, 魯智深, 高俅 (19 dimmed)', async ({ page }) => {
    await openGraph(page, ['林沖']);
    await expectAtCenter(page, '林沖');
    await expect(dimmed(page)).toHaveCount(19);
    expect(await clearNames(page)).toEqual(['林沖', '魯智深', '高俅'].sort());
    await expect(plus(page, '林沖')).toHaveCount(0);
  });

  test('AC-P31 林沖 selected: clicking 高俅 plus adds 高俅 to the filter', async ({ page }) => {
    await openGraph(page, ['林沖']);
    await plus(page, '高俅').click();
    await expect(characterPickButton(page, '高俅')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('selected-bar').getByRole('button', { name: '移除 高俅' })).toBeVisible();
    await expect(plus(page, '高俅')).toHaveCount(0);
    await expect(page.getByTestId('character-drawer')).toHaveCount(0);
  });

  test('AC-P32 clicking the 宋江 node opens his character drawer', async ({ page }) => {
    await openGraph(page);
    await nodeCircle(page, '宋江').click();
    const d = page.getByTestId('character-drawer');
    await expect(d).toHaveAttribute('data-page', 'S4 角色資料面板');
    await expect(d.getByRole('heading', { level: 2 })).toHaveText('宋江');
    await expect(page).toHaveURL(/#graph$/);
  });

  test('AC-P40 none selected: 宋江 centered and the legend has no 師徒', async ({ page }) => {
    await openGraph(page);
    await expectAtCenter(page, '宋江');
    const text = normalizeText(await legend(page).innerText());
    expect(text).not.toContain('師徒');
  });

  test('AC-S18 arc 三打祝家莊, none selected: characters absent from the arc dim; count matches timeline', async ({
    page,
  }) => {
    await gotoApp(page);
    await selectArc(page, '三打祝家莊');
    const timelineCount = await resultCount(page);
    await switchView(page, '關係圖');
    await expect(pageBlock(page, 'S6')).toBeVisible();
    expect(await resultCount(page)).toBe(timelineCount);
    expect(await clearNames(page)).toEqual(
      ['李逵', '楊雄', '石秀', '戴宗', '時遷', '宋江', '吳用', '林沖', '扈三娘', '王英'].sort(),
    );
    await expect(dimmed(page)).toHaveCount(12);
    await expect(graph(page).getByText('沒有符合條件的事件')).toHaveCount(0);
  });

  test('AC-S20 arc 誤走妖魔 plus 王英: every node (incl. 王英) dims and the empty state shows', async ({ page }) => {
    await gotoApp(page);
    await selectArc(page, '誤走妖魔・魯智深與林沖');
    await pickCharacter(page, '王英');
    await switchView(page, '關係圖');
    await expect(dimmed(page)).toHaveCount(22);
    await expect(nodeOf(page, '王英')).toHaveAttribute('data-dim', 'true');
    await expect(graph(page).getByText('沒有符合條件的事件', { exact: true })).toBeVisible();
    const clear = graph(page).getByRole('button', { name: '清除篩選', exact: true });
    await expect(clear).toBeVisible();
    await clear.click();
    expect(await resultCount(page)).toBe(54);
    await expect(dimmed(page)).toHaveCount(0);
  });

  test('AC-S22 legend caption follows the current selection', async ({ page }) => {
    await openGraph(page, ['林沖']);
    await expect(caption(page)).toHaveText(SHORT_CAPTION);
    expect(normalizeText(await legend(page).innerText())).not.toContain('未選角色時以宋江為中心');
    await pickCharacter(page, '林沖');
    await expect(caption(page)).toHaveText(FULL_CAPTION);
  });
});
