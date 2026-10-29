/**
 * US4 上一個／下一個：自角色資料開啟不在篩選結果中的事件（T102；spec US4 AC-S15、G-2、contracts/ui-contracts.md S3／S4）。
 *
 * 本檔 1 條：AC-S15。需 US5 的角色資料入口（chip 資料鈕 → S4 參與事件），故於 US5 撰寫。
 * 規則（G-2）：事件不在目前篩選結果中 → 上一個／下一個依全書事件順序（起始回、迄回、原順序）；
 * 「宋公明神聚蓼兒洼」為全書最後一個事件，其前一個為同在第 120 回的「眾將散去」。
 *
 * 定位：角色資料面板 `data-testid="character-drawer"`，參與事件區塊依小標「參與事件（<N>）」；
 * 事件明細 `data-testid="event-drawer"`，上一個／下一個在底部 `.pn`。
 */
import type { Locator } from '@playwright/test';
import { expect, gotoApp, normalizeText, openCharacterInfo, pickCharacter, test } from './fixtures/app';

function prevButton(d: Locator): Locator {
  return d.locator('.pn button').first();
}
function nextButton(d: Locator): Locator {
  return d.locator('.pn button').last();
}

test('AC-S15 event outside the filter opened from 宋江 data navigates in whole-book order', async ({ page }) => {
  await gotoApp(page, 'timeline');
  await pickCharacter(page, '林沖');

  await openCharacterInfo(page, '宋江');
  const cd = page.getByTestId('character-drawer');
  await expect(cd.getByRole('heading', { level: 2 })).toHaveText('宋江');
  const events = cd.locator('.sec', { has: page.getByRole('heading', { name: /^參與事件（/ }) });
  await events.getByRole('button', { name: /宋公明神聚蓼兒洼/ }).click();

  const d = page.getByTestId('event-drawer');
  await expect(d.getByRole('heading', { level: 2 })).toHaveText('宋公明神聚蓼兒洼');
  // 林沖未參與此事件 → 不在篩選結果中，依全書順序：已是最後一個
  await expect(nextButton(d)).toBeDisabled();
  expect(normalizeText(await nextButton(d).innerText())).toBe('已是最後一個 →');
  await expect(prevButton(d)).toBeEnabled();
  expect(normalizeText(await prevButton(d).innerText())).toBe('← 眾將散去');

  await prevButton(d).click();
  await expect(d.getByRole('heading', { level: 2 })).toHaveText('眾將散去');
});
