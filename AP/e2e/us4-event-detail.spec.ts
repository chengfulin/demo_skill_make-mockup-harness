/**
 * US4 檢視事件明細（T088；spec US4 驗收、FR-012、G-2、contracts/ui-contracts.md S3）。
 *
 * 本檔 8 條：AC-10、AC-11、AC-P18、AC-P19、AC-P20、AC-P21、AC-S26、AC-S27。
 * AC-S15（從角色資料開啟不在篩選結果中的事件）需 US5 的角色資料入口，於 e2e/us4-prevnext-from-character.spec.ts（T102）。
 * AC-P21 本檔只驗「面板關閉、hash `#map`、「地圖」分頁 aria-selected」；地圖標記高亮於 US6 e2e/us6-map.spec.ts 補驗。
 *
 * 定位：面板 `data-testid="event-drawer"`（data-page「S3 事件明細面板」）；區塊依小標 h4（回目／地點／參與角色）；
 * 參與角色頭像鈕 `button.add`（aria-label「將 <姓名> 加入篩選」）、每列 `.person`；
 * 地點可定位為 `button.place`、不可定位為 `span.badge`；上一個／下一個在底部 `.pn`。
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
  test,
} from './fixtures/app';

function drawer(page: Page): Locator {
  return page.getByTestId('event-drawer');
}

/** 時間軸上指定事件名的事件卡 */
function eventCard(page: Page, title: string): Locator {
  return page
    .getByTestId('timeline')
    .getByTestId('event-card')
    .filter({ has: page.getByText(title, { exact: true }) });
}

/** 點事件卡開面板，並等面板標題為該事件 */
async function openEvent(page: Page, title: string): Promise<Locator> {
  await eventCard(page, title).click();
  const d = drawer(page);
  await expect(d).toHaveAttribute('data-page', 'S3 事件明細面板');
  await expect(d.getByRole('heading', { level: 2 })).toHaveText(title);
  return d;
}

/** 面板內依小標取區塊（`.sec`） */
function section(d: Locator, heading: '回目' | '地點' | '參與角色'): Locator {
  return d.locator('.sec', { has: d.page().getByRole('heading', { name: heading, exact: true }) });
}

/** 回目列（正規化後文字） */
async function chapterRows(d: Locator): Promise<string[]> {
  return (await section(d, '回目').getByRole('listitem').allInnerTexts()).map(normalizeText);
}

/** 參與角色列中的姓名（名字鈕 `button.nmb`，依畫面順序） */
async function participantNames(d: Locator): Promise<string[]> {
  return (await section(d, '參與角色').locator('button.nmb').allInnerTexts()).map((s) => s.trim());
}

/** 參與角色中某人的那一列 */
function personRow(d: Locator, name: string): Locator {
  return section(d, '參與角色')
    .locator('.person')
    .filter({ has: d.page().locator('button.nmb', { hasText: name }) });
}

/** 底部上一個／下一個鈕 */
function prevButton(d: Locator): Locator {
  return d.locator('.pn button').first();
}
function nextButton(d: Locator): Locator {
  return d.locator('.pn button').last();
}

const CH_28_31 = [
  '第二十八回 武松威鎮安平寨 施恩義奪快活林',
  '第二十九回 施恩重霸孟州道 武松醉打蔣門神',
  '第三十回 施恩三入死囚牢 武松大鬧飛雲浦',
  '第三十一回 張都監血濺鴛鴦樓 武行者夜走蜈蚣嶺',
];

test.describe('US4 event detail', () => {
  test('AC-10 醉打蔣門神 panel shows ch 28-31 with titles, place 孟州 and 武松', async ({ page }) => {
    await gotoApp(page);
    const d = await openEvent(page, '醉打蔣門神・血濺鴛鴦樓');
    expect(normalizeText(await d.locator('.ed-head').innerText())).toContain('第28–31回');
    await expect.poll(() => chapterRows(d)).toEqual(CH_28_31);
    await expect(section(d, '地點').locator('button.place')).toHaveText(/孟州 · 在地圖上看/);
    await expect.poll(() => participantNames(d)).toEqual(['武松']);
  });

  test('AC-11 clicking 魯智深 avatar adds him to the filter and the timeline updates', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '林沖');
    await expect.poll(() => resultCount(page)).toBe(10);
    const d = await openEvent(page, '大鬧野豬林');
    await section(d, '參與角色').getByRole('button', { name: '將 魯智深 加入篩選', exact: true }).click();
    await expect(characterPickButton(page, '魯智深')).toHaveAttribute('aria-pressed', 'true');
    await expect(characterPickButton(page, '林沖')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => resultCount(page)).toBe(16);
    // 只有魯智深的事件出現在時間軸
    await expect(eventCard(page, '魯提轄拳打鎮關西')).toHaveCount(1);
  });

  test('AC-P18 醉打蔣門神 panel lists 4 chapter titles', async ({ page }) => {
    await gotoApp(page);
    const d = await openEvent(page, '醉打蔣門神・血濺鴛鴦樓');
    expect(normalizeText(await d.locator('.ed-head').innerText())).toContain('第28–31回');
    await expect(section(d, '回目').getByRole('listitem')).toHaveCount(4);
    expect(await chapterRows(d)).toEqual(CH_28_31);
    await expect(section(d, '地點')).toContainText('孟州');
    expect(await participantNames(d)).toEqual(['武松']);
  });

  test('AC-P19 adding 魯智深 from the panel keeps the panel open', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '林沖');
    const d = await openEvent(page, '大鬧野豬林');
    await expect(personRow(d, '林沖')).toContainText('已在篩選中');
    await expect(personRow(d, '魯智深')).not.toContainText('已在篩選中');
    await section(d, '參與角色').getByRole('button', { name: '將 魯智深 加入篩選', exact: true }).click();
    await expect(characterPickButton(page, '魯智深')).toHaveAttribute('aria-pressed', 'true');
    // 面板維持開啟、仍是同一事件，兩人皆「已在篩選中」（S3-02）
    await expect(d).toBeVisible();
    await expect(d.getByRole('heading', { level: 2 })).toHaveText('大鬧野豬林');
    await expect(personRow(d, '魯智深')).toContainText('已在篩選中');
    await expect(personRow(d, '林沖')).toContainText('已在篩選中');
    await expect(personRow(d, '魯智深').locator('button.add .av.ring')).toHaveCount(1);
  });

  test('AC-P20 next with 林沖+魯智深 goes to 棒打洪教頭 in filtered order', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '林沖');
    await pickCharacter(page, '魯智深');
    const d = await openEvent(page, '大鬧野豬林');
    await expect(prevButton(d)).toHaveText(/←\s*林沖誤入白虎堂/);
    await expect(nextButton(d)).toHaveText(/棒打洪教頭\s*→/);
    await nextButton(d).click();
    await expect(d.getByRole('heading', { level: 2 })).toHaveText('棒打洪教頭');
    await expect(prevButton(d)).toHaveText(/←\s*大鬧野豬林/);
  });

  test('AC-P21 clicking the place closes the panel and switches to the map view', async ({ page }) => {
    await gotoApp(page);
    const d = await openEvent(page, '大鬧野豬林');
    await section(d, '地點').getByRole('button', { name: '野豬林 · 在地圖上看', exact: true }).click();
    await expect(drawer(page)).toHaveCount(0);
    await expect(page).toHaveURL(/#map$/);
    await expect(pageBlock(page, 'S1').getByRole('tab', { name: '地圖', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    // 地圖標記高亮於 US6（e2e/us6-map.spec.ts）補驗
  });

  test('AC-S26 first filtered event has prev disabled with 已是第一個', async ({ page }) => {
    await gotoApp(page);
    await pickCharacter(page, '林沖');
    const d = await openEvent(page, '倒拔垂楊柳・林沖結義');
    await expect(prevButton(d)).toHaveText(/←\s*已是第一個/);
    await expect(prevButton(d)).toBeDisabled();
    await expect(nextButton(d)).toHaveText(/林沖誤入白虎堂\s*→/);
    await expect(nextButton(d)).toBeEnabled();
  });

  test('AC-S27 九天玄女授天書 place is a badge that cannot be located on the map', async ({ page }) => {
    await gotoApp(page);
    const d = await openEvent(page, '九天玄女授天書');
    const place = section(d, '地點');
    await expect(place.locator('span.badge')).toHaveText('還道村（無法在示意地圖上定位）');
    await expect(place.getByRole('button')).toHaveCount(0);
    await expect(d).not.toContainText('在地圖上看');
  });
});
