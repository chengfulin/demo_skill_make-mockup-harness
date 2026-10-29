/**
 * US3 依大節篩選（T078；spec US3 驗收、FR-011、FR-003 交集、FR-005；contracts/ui-contracts.md S1／S2）。
 *
 * 本檔 9 條：AC-08、AC-09、AC-P15、AC-P16、AC-P17、AC-S14，
 * 以及需大節選單、自前面 story 移入的 AC-P13、AC-P14（US2 空狀態與「清除篩選」）、AC-S13（US1 篩選區三視圖常駐）。
 * 另加非 AC 的回歸測試（T144 遺留缺陷）：切換大節（色帶或選單）時時間軸 `.tl-scroll` 橫向捲動歸零。
 *
 * 定位：大節選單 `select[aria-label="大節"]`（fixture `selectArc` 依選項文字「<大節名>（第 a–b 回）」選取）；
 * 色帶 `[data-testid="timeline"] .arcs button.arc`（`<b>` 為大節名）；刻度 `.ruler .tick:not(.minor)` 為標數字者；
 * 空狀態依逐字文案「沒有符合條件的事件」與按鈕「清除篩選」。
 * 截圖對照：S2-03-大節三打祝家莊（1 個色帶「三打祝家莊 43–50」；刻度 43、50；4 張卡）、S2-04-空狀態。
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
  type ViewLabel,
} from './fixtures/app';

const ARC_05_TITLES = ['沂嶺殺四虎', '楊雄石秀結義・翠屏山', '火燒祝家店', '三打祝家莊'];

function arcSelect(page: Page): Locator {
  return pageBlock(page, 'S1').locator('select[aria-label="大節"]');
}

function timelineCards(page: Page): Locator {
  return page.getByTestId('timeline').getByTestId('event-card');
}

/** 時間軸事件卡標題（依畫面順序；卡片 `.t`） */
async function cardTitles(page: Page): Promise<string[]> {
  return (await timelineCards(page).locator('.t').allTextContents()).map((s) => s.trim());
}

/** 色帶上的大節名 */
async function bandNames(page: Page): Promise<string[]> {
  return (await page.getByTestId('timeline').locator('.arcs button.arc b').allTextContents()).map((s) => s.trim());
}

/** 標數字的章回刻度 */
async function majorTicks(page: Page): Promise<number[]> {
  return (await page.getByTestId('timeline').locator('.ruler .tick:not(.minor)').allTextContents()).map(Number);
}

/** 選單目前選項文字 */
async function selectedArcLabel(page: Page): Promise<string> {
  return arcSelect(page).evaluate((el) => {
    const select = el as HTMLSelectElement;
    return (select.selectedOptions[0]?.textContent ?? '').trim();
  });
}

test.describe('US3 arc filter', () => {
  test('AC-08 selecting 三打祝家莊 shows only that arc chapters and events', async ({ page }) => {
    await gotoApp(page);
    await selectArc(page, '三打祝家莊');
    expect(await bandNames(page)).toEqual(['三打祝家莊']);
    const band = page.getByTestId('timeline').locator('.arcs button.arc');
    expect(normalizeText(await band.innerText())).toContain('43–50');
    const ticks = await majorTicks(page);
    expect(Math.min(...ticks)).toBe(43);
    expect(Math.max(...ticks)).toBe(50);
    await expect(timelineCards(page)).toHaveCount(4);
    expect((await cardTitles(page)).every((title) => ARC_05_TITLES.includes(title))).toBe(true);
  });

  test('AC-09 arc 征方臘 with 武松 shows only his events in that arc', async ({ page }) => {
    await gotoApp(page);
    await selectArc(page, '征方臘');
    await pickCharacter(page, '武松');
    await expect(timelineCards(page)).toHaveCount(2);
    expect(await resultCount(page)).toBe(2);
    // 每張卡都含武松（已選者頭像排前並加外框）
    const allHaveWusong = await timelineCards(page).evaluateAll((els) =>
      els.every((el) => [...el.querySelectorAll('.avs .av.ring')].some((av) => (av.textContent ?? '').trim() === '武')),
    );
    expect(allHaveWusong).toBe(true);
    expect(await bandNames(page)).toEqual(['征方臘']);
  });

  test('AC-P15 三打祝家莊 shows exactly 4 events and ticks 43 and 50', async ({ page }) => {
    await gotoApp(page);
    await selectArc(page, '三打祝家莊');
    expect(await resultCount(page)).toBe(4);
    await expect(timelineCards(page)).toHaveCount(4);
    expect(await majorTicks(page)).toEqual([43, 50]);
    expect([...(await cardTitles(page))].sort()).toEqual([...ARC_05_TITLES].sort());
  });

  test('AC-P16 征方臘 plus 武松 shows 睦州血戰 and 魯智深擒方臘・浙江坐化', async ({ page }) => {
    await gotoApp(page);
    await selectArc(page, '征方臘');
    await pickCharacter(page, '武松');
    await expect(timelineCards(page)).toHaveCount(2);
    expect(await cardTitles(page)).toEqual(['睦州血戰', '魯智深擒方臘・浙江坐化']);
  });

  test('AC-P17 clicking the 武松 arc band sets the arc select to that arc', async ({ page }) => {
    await gotoApp(page);
    await page.getByTestId('timeline').locator('.arcs button.arc', { has: page.getByText('武松', { exact: true }) }).click();
    await expect(arcSelect(page)).toHaveValue('arc-03');
    expect(await selectedArcLabel(page)).toBe('武松（第 23–31 回）');
    expect(await bandNames(page)).toEqual(['武松']);
    expect(await resultCount(page)).toBe(3);
  });

  test('AC-S14 choosing 全部大節 restores chapters 1-120 and 54 events', async ({ page }) => {
    await gotoApp(page);
    await selectArc(page, '三打祝家莊');
    expect(await resultCount(page)).toBe(4);
    await selectArc(page, '全部大節');
    await expect(arcSelect(page)).toHaveValue('');
    expect(await resultCount(page)).toBe(54);
    await expect(page.getByTestId('timeline').locator('.arcs button.arc')).toHaveCount(12);
    const ticks = await majorTicks(page);
    expect(Math.min(...ticks)).toBe(1);
    expect(Math.max(...ticks)).toBe(120);
    await expect(timelineCards(page)).toHaveCount(54);
  });

  test('AC-P13 arc 誤走妖魔 plus 王英 shows the empty state with 清除篩選', async ({ page }) => {
    await gotoApp(page);
    await selectArc(page, '誤走妖魔・魯智深與林沖');
    await pickCharacter(page, '王英');
    const s2 = pageBlock(page, 'S2');
    await expect(s2.getByText('沒有符合條件的事件', { exact: true })).toBeVisible();
    await expect(s2.getByText('目前的角色與大節組合下沒有事件。', { exact: true })).toBeVisible();
    await expect(s2.getByRole('button', { name: '清除篩選', exact: true })).toBeVisible();
    await expect(timelineCards(page)).toHaveCount(0);
    expect(await resultCount(page)).toBe(0);
  });

  test('AC-P14 清除篩選 clears characters and arc and restores 54', async ({ page }) => {
    await gotoApp(page);
    await selectArc(page, '誤走妖魔・魯智深與林沖');
    await pickCharacter(page, '王英');
    await pageBlock(page, 'S2').getByRole('button', { name: '清除篩選', exact: true }).click();
    expect(await resultCount(page)).toBe(54);
    await expect(arcSelect(page)).toHaveValue('');
    await expect(characterPickButton(page, '王英')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('selected-bar').getByRole('button', { name: /^移除 / })).toHaveCount(0);
    await expect(timelineCards(page)).toHaveCount(54);
  });

  test('AC-S13 filter bar, arc select, selected tags, count and tabs render above every view', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '武松');
    await selectArc(page, '武松');
    const views: [ViewLabel, 'S2' | 'S5' | 'S6'][] = [
      ['時間軸', 'S2'],
      ['地圖', 'S5'],
      ['關係圖', 'S6'],
      ['時間軸', 'S2'],
    ];
    for (const [label, key] of views) {
      await switchView(page, label);
      const s1 = pageBlock(page, 'S1');
      await expect(s1).toBeVisible();
      await expect(s1.getByTestId('char-list')).toBeVisible();
      await expect(arcSelect(page)).toBeVisible();
      await expect(arcSelect(page)).toHaveValue('arc-03');
      await expect(s1.getByTestId('selected-bar').getByRole('button', { name: '移除 武松' })).toBeVisible();
      await expect(s1.getByTestId('result-count')).toBeVisible();
      await expect(s1.getByRole('tablist')).toBeVisible();
      expect(await resultCount(page)).toBe(3);
      // 篩選區在視圖區塊之上（頁面上方；不要求捲動固定）
      const view = pageBlock(page, key);
      await expect(view).toHaveCount(1);
      const s1Box = await s1.boundingBox();
      const viewBox = await view.boundingBox();
      expect(s1Box).not.toBeNull();
      expect(viewBox).not.toBeNull();
      if (s1Box && viewBox) expect(s1Box.y + s1Box.height).toBeLessThanOrEqual(viewBox.y + 1);
    }
  });

  // T144 回歸（Prototype 行為、不在 AC 範圍）：時間軸捲到最右再切大節，
  // 橫向捲動須歸零，色帶標題與左側卡片不得被切掉。
  test('switching arc resets the timeline horizontal scroll to the start', async ({ page }) => {
    await gotoApp(page);
    const scroller = page.getByTestId('timeline');
    const scrollToEnd = () =>
      scroller.evaluate((el) => {
        el.scrollLeft = el.scrollWidth;
        return el.scrollLeft;
      });
    const scrollLeft = () => scroller.evaluate((el) => el.scrollLeft);

    // 1) 點色帶：捲到最右後點最後一個色帶「征方臘」
    expect(await scrollToEnd()).toBeGreaterThan(0);
    await scroller.locator('.arcs button.arc', { has: page.getByText('征方臘', { exact: true }) }).click();
    await expect(arcSelect(page)).not.toHaveValue('');
    expect(await bandNames(page)).toEqual(['征方臘']);
    await expect.poll(scrollLeft).toBe(0);
    await expect(scroller.locator('.arcs button.arc').first()).toBeInViewport({ ratio: 1 });
    await expect(timelineCards(page).first()).toBeInViewport();

    // 2) 用選單：在大節內捲到最右（若可捲）後切另一個大節，再切回全部大節
    await scrollToEnd();
    await selectArc(page, '武松');
    await expect.poll(scrollLeft).toBe(0);
    await expect(scroller.locator('.arcs button.arc').first()).toBeInViewport({ ratio: 1 });
    await scrollToEnd();
    await selectArc(page, '全部大節');
    await expect(timelineCards(page)).toHaveCount(54);
    await expect.poll(scrollLeft).toBe(0);
  });
});
