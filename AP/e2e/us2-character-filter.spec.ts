/**
 * US2 依角色篩選事件（T064；spec US2 驗收、contracts/ui-contracts.md S1／S2）。
 *
 * 本檔 22 條：AC-03、AC-04、AC-05、AC-06、AC-07、AC-P3、AC-P4、AC-P5、AC-P6、AC-P7、AC-P8、AC-P9、AC-P10、
 * AC-P11、AC-P12、AC-P33、AC-P34、AC-S7、AC-S8、AC-S9、AC-S19、AC-S21。
 * AC-P13、AC-P14（空狀態與「清除篩選」）需大節選單，於 US3 的 e2e/us3-arc-filter.spec.ts（T078）。
 *
 * 定位：搜尋框 role=searchbox「搜尋角色」；快選 role=button「天罡」「地煞」（aria-pressed）；
 * chip 以 fixture 的 `button.pick[aria-pressed]`；已選列 `data-testid="selected-bar"` 內「移除 <姓名>」鈕。
 */
import type { Locator, Page } from '@playwright/test';
import { characterPickButton, expect, gotoApp, pageBlock, pickCharacter, resultCount, switchView, test } from './fixtures/app';

/** 收錄名單（characters.json）中的群組成員數，僅作期望值（AC 文字：天罡 17 位） */
const TIANGANG_COUNT = 17;
const DISHA = ['扈三娘', '王英', '時遷'];

function searchBox(page: Page): Locator {
  return pageBlock(page, 'S1').getByRole('searchbox', { name: '搜尋角色' });
}

function groupButton(page: Page, label: '天罡' | '地煞'): Locator {
  return pageBlock(page, 'S1').getByRole('button', { name: label, exact: true });
}

/** 角色清單中各 chip 的姓名（依畫面順序） */
async function listedNames(page: Page): Promise<string[]> {
  return (await page.getByTestId('char-list').locator('button.pick .nm').allTextContents()).map((s) => s.trim());
}

/** 已選 chip 的姓名 */
async function pressedNames(page: Page): Promise<string[]> {
  return (
    await page.getByTestId('char-list').locator('button.pick[aria-pressed="true"] .nm').allTextContents()
  ).map((s) => s.trim());
}

/** 已選列標籤（依「移除 <姓名>」鈕的 aria-label，依畫面順序） */
async function tagNames(page: Page): Promise<string[]> {
  const labels = await page
    .getByTestId('selected-bar')
    .getByRole('button', { name: /^移除 / })
    .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''));
  return labels.map((l) => l.replace(/^移除 /, ''));
}

function timelineCards(page: Page): Locator {
  return page.getByTestId('timeline').getByTestId('event-card');
}

function eventCard(page: Page, title: string): Locator {
  return page.getByTestId('event-card').filter({ has: page.getByText(title, { exact: true }) });
}

/** 每張事件卡都含指定頭像字之一且加朱色外框（已選者排前，故必在前 3 個頭像內） */
async function everyCardHasRing(page: Page, avatars: string[]): Promise<boolean> {
  return timelineCards(page).evaluateAll(
    (els, chars) =>
      els.every((el) =>
        [...el.querySelectorAll('.avs .av.ring')].some((av) => chars.includes((av.textContent ?? '').trim())),
      ),
    avatars,
  );
}

test.describe('US2 character filter', () => {
  test('AC-03 selecting 武松 leaves only his events and updates the count', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '武松');
    await expect(timelineCards(page)).toHaveCount(8);
    expect(await resultCount(page)).toBe(8);
    expect(await everyCardHasRing(page, ['武'])).toBe(true);
  });

  test('AC-04 adding 魯智深 shows the union of both', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '武松');
    await pickCharacter(page, '魯智深');
    await expect(timelineCards(page)).toHaveCount(14);
    expect(await everyCardHasRing(page, ['武', '魯'])).toBe(true);
    // 只含其中一人的事件也在
    await expect(eventCard(page, '景陽岡打虎')).toHaveCount(1);
    await expect(eventCard(page, '魯提轄拳打鎮關西')).toHaveCount(1);
  });

  test('AC-05 typing 豹子頭 leaves only 林沖 in the list', async ({ page }) => {
    await gotoApp(page);
    await searchBox(page).fill('豹子頭');
    await expect.poll(() => listedNames(page)).toEqual(['林沖']);
  });

  test('AC-06 Enter on 黑旋風 selects 李逵 and shows the tag', async ({ page }) => {
    await gotoApp(page);
    await searchBox(page).fill('黑旋風');
    await searchBox(page).press('Enter');
    await expect.poll(() => tagNames(page)).toEqual(['李逵']);
    expect(await pressedNames(page)).toEqual(['李逵']);
  });

  test('AC-07 天罡 selects all 天罡 characters except 晁蓋', async ({ page }) => {
    await gotoApp(page);
    await groupButton(page, '天罡').click();
    await expect(groupButton(page, '天罡')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await pressedNames(page)).length).toBe(TIANGANG_COUNT);
    expect(await pressedNames(page)).not.toContain('晁蓋');
  });

  test('AC-P3 selecting 武松 gives result count 8', async ({ page }) => {
    await gotoApp(page);
    expect(await resultCount(page)).toBe(54);
    await pickCharacter(page, '武松');
    await expect.poll(() => resultCount(page)).toBe(8);
  });

  test('AC-P4 adding 魯智深 gives result count 14', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '武松');
    await pickCharacter(page, '魯智深');
    await expect.poll(() => resultCount(page)).toBe(14);
  });

  test('AC-P5 selected avatars come first with a seal ring on event cards', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '武松');
    await pickCharacter(page, '魯智深');
    // 柴進莊上會武松：資料順序 宋江、武松、柴進 → 武松排第一且加外框，其他不加
    const chai = eventCard(page, '柴進莊上會武松').locator('.avs .av');
    await expect(chai).toHaveText(['武', '宋', '柴']);
    await expect(chai.nth(0)).toHaveClass(/\bring\b/);
    await expect(chai.nth(1)).not.toHaveClass(/\bring\b/);
    // 三山聚義打青州：魯智深、武松皆已選 → 兩者在前且加外框
    const qing = eventCard(page, '三山聚義打青州').locator('.avs .av');
    await expect(qing.nth(0)).toHaveText('魯');
    await expect(qing.nth(1)).toHaveText('武');
    await expect(qing.nth(0)).toHaveClass(/\bring\b/);
    await expect(qing.nth(1)).toHaveClass(/\bring\b/);
    await expect(qing.nth(2)).not.toHaveClass(/\bring\b/);
  });

  test('AC-P6 typing 豹子頭 leaves only 林沖', async ({ page }) => {
    await gotoApp(page);
    await searchBox(page).fill('豹子頭');
    await expect.poll(() => listedNames(page)).toEqual(['林沖']);
  });

  test('AC-P7 typing 黑旋風 leaves only 李逵', async ({ page }) => {
    await gotoApp(page);
    await searchBox(page).fill('黑旋風');
    await expect.poll(() => listedNames(page)).toEqual(['李逵']);
  });

  test('AC-P8 typing 孫悟空 shows no-match text instead of the list', async ({ page }) => {
    await gotoApp(page);
    await searchBox(page).fill('孫悟空');
    const list = page.getByTestId('char-list');
    await expect(list.getByText('找不到符合的角色', { exact: true })).toBeVisible();
    await expect(list.locator('button.pick')).toHaveCount(0);
  });

  test('AC-P9 天罡 selects 17 characters without 晁蓋', async ({ page }) => {
    await gotoApp(page);
    await groupButton(page, '天罡').click();
    await expect.poll(async () => (await tagNames(page)).length).toBe(TIANGANG_COUNT);
    expect(await tagNames(page)).not.toContain('晁蓋');
    await expect(characterPickButton(page, '晁蓋')).toHaveAttribute('aria-pressed', 'false');
  });

  test('AC-P10 pressing 天罡 again clears the selection', async ({ page }) => {
    await gotoApp(page);
    await groupButton(page, '天罡').click();
    await expect(groupButton(page, '天罡')).toHaveAttribute('aria-pressed', 'true');
    await groupButton(page, '天罡').click();
    await expect(groupButton(page, '天罡')).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => tagNames(page)).toEqual([]);
    await expect(page.getByTestId('selected-bar')).toContainText('未選角色，顯示全部角色的事件');
    expect(await resultCount(page)).toBe(54);
  });

  test('AC-P11 removing the 宋江 tag leaves only 李逵', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '宋江');
    await pickCharacter(page, '李逵');
    await expect.poll(() => tagNames(page)).toEqual(['宋江', '李逵']);
    await page.getByTestId('selected-bar').getByRole('button', { name: '移除 宋江', exact: true }).click();
    await expect.poll(() => tagNames(page)).toEqual(['李逵']);
    expect(await pressedNames(page)).toEqual(['李逵']);
  });

  test('AC-P12 clear all returns the count to 54', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '武松');
    await pickCharacter(page, '林沖');
    await expect.poll(() => resultCount(page)).not.toBe(54);
    await page.getByTestId('selected-bar').getByRole('button', { name: '清除全部', exact: true }).click();
    await expect.poll(() => resultCount(page)).toBe(54);
    await expect(page.getByTestId('selected-bar')).toContainText('未選角色，顯示全部角色的事件');
  });

  test('AC-P33 selection made on the graph view is kept on the timeline', async ({ page }) => {
    await gotoApp(page, 'graph');
    await pickCharacter(page, '林沖');
    await pickCharacter(page, '宋江');
    await expect.poll(() => resultCount(page)).toBe(31);
    await switchView(page, '時間軸');
    await expect.poll(() => tagNames(page)).toEqual(['林沖', '宋江']);
    expect(await resultCount(page)).toBe(31);
    await expect(timelineCards(page)).toHaveCount(31);
  });

  test('AC-P34 Enter on 黑旋風 selects 李逵 and shows the tag', async ({ page }) => {
    await gotoApp(page);
    await searchBox(page).fill('黑旋風');
    await searchBox(page).press('Enter');
    await expect(
      page.getByTestId('selected-bar').getByRole('button', { name: '移除 李逵', exact: true }),
    ).toBeVisible();
    await expect.poll(() => resultCount(page)).toBe(8);
  });

  test('AC-S7 地煞 selects only 地煞 characters; pressing again clears', async ({ page }) => {
    await gotoApp(page);
    await groupButton(page, '地煞').click();
    await expect(groupButton(page, '地煞')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => [...(await pressedNames(page))].sort()).toEqual([...DISHA].sort());
    await expect(groupButton(page, '天罡')).toHaveAttribute('aria-pressed', 'false');
    await groupButton(page, '地煞').click();
    await expect.poll(() => tagNames(page)).toEqual([]);
  });

  test('AC-S8 晁蓋 then 天罡 keeps 晁蓋: 18 selected', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '晁蓋');
    await groupButton(page, '天罡').click();
    await expect(groupButton(page, '天罡')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await tagNames(page)).length).toBe(TIANGANG_COUNT + 1);
    expect((await tagNames(page))[0]).toBe('晁蓋');
  });

  test('AC-S9 pressing 天罡 again removes only 天罡, 晁蓋 stays', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '晁蓋');
    await groupButton(page, '天罡').click();
    await expect.poll(async () => (await tagNames(page)).length).toBe(TIANGANG_COUNT + 1);
    await groupButton(page, '天罡').click();
    await expect.poll(() => tagNames(page)).toEqual(['晁蓋']);
    expect(await pressedNames(page)).toEqual(['晁蓋']);
  });

  test('AC-S19 Enter does not deselect an already selected match nor act on no match', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '林沖');
    await searchBox(page).fill('豹子頭');
    await expect.poll(() => listedNames(page)).toEqual(['林沖']);
    await searchBox(page).press('Enter');
    await expect.poll(() => tagNames(page)).toEqual(['林沖']);
    expect(await pressedNames(page)).toEqual(['林沖']);

    await searchBox(page).fill('孫悟空');
    await expect(page.getByTestId('char-list').getByText('找不到符合的角色', { exact: true })).toBeVisible();
    await searchBox(page).press('Enter');
    await expect.poll(() => tagNames(page)).toEqual(['林沖']);
    expect(await resultCount(page)).toBe(10);
  });

  test('AC-S21 explanatory text 座次 finds nothing; 呼保義 finds only 宋江', async ({ page }) => {
    await gotoApp(page);
    await searchBox(page).fill('座次');
    const list = page.getByTestId('char-list');
    await expect(list.getByText('找不到符合的角色', { exact: true })).toBeVisible();
    await expect(list.locator('button.pick')).toHaveCount(0);
    await searchBox(page).fill('呼保義');
    await expect.poll(() => listedNames(page)).toEqual(['宋江']);
  });
});
