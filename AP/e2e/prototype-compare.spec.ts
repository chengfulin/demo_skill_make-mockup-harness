/**
 * Prototype 並列比對（T140；SC-003；plan「Prototype 並列比對 E2E」）。
 *
 * 執行：`npm run e2e:compare`（playwright.config.ts 的 `compare` project：Chrome、1440×900、colorScheme light）。
 * 每個狀態（fixtures/prototypeStates.ts，21 個）：開新頁 `/#timeline` → 執行步驟 → 等動畫結束 →
 * `fullPage` 截圖至 `AP/test-results/compare/<檔名>.png`（與 Prototype `screens/` 同名，供人並列目視）→ DOM 斷言：
 *   ① 區塊順序：各 `data-page` 區塊內的子區塊依 ui-contracts 所列順序出現（`BLOCK_ORDER`）；
 *   ② 必含文案：以 `normalizeText` 比對該區塊 `innerText`；
 *   ③ 狀態斷言：結果數、已選標籤、`aria-pressed`／`aria-selected`、`data-dim` 數等。
 * 截圖先於斷言，斷言失敗時仍留下截圖供對看。#20、#21 圖例說明依 D-4 斷言新文案（並列目視不計逐字一致）。
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { expect, gotoApp, normalizeText, pageBlock, test, type PageKey } from './fixtures/app';
import { BLOCK_ORDER, PROTOTYPE_STATES, type OrderItem } from './fixtures/prototypeStates';

const COMPARE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../test-results/compare');

test.use({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });

/** 等字型就緒、所有 CSS transition／animation 結束（含無限循環以外者），再等兩個 frame 讓版面穩定。 */
async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity),
  );
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
}

/** 回傳每一項在區塊內找到的元素序號（文件順序）；找不到為 -1。 */
async function orderPositions(page: Page, key: PageKey, items: OrderItem[]): Promise<number[]> {
  return pageBlock(page, key).evaluate((root, list) => {
    const all = [root, ...root.querySelectorAll('*')];
    const indexOf = new Map(all.map((el, i) => [el, i] as const));
    return list.map(({ css, text }) => {
      const found = [...root.querySelectorAll(css)].find(
        (el) =>
          text === undefined ||
          ((el.textContent ?? '').includes(text) &&
            ![...el.children].some((c) => (c.textContent ?? '').includes(text))),
      );
      return found ? (indexOf.get(found) ?? -1) : -1;
    });
  }, items);
}

test.describe('Prototype side-by-side compare (SC-003)', () => {
  for (const state of PROTOTYPE_STATES) {
    const no = String(state.no).padStart(2, '0');
    test(`#${no} ${state.file}`, async ({ page }) => {
      await gotoApp(page, 'timeline');
      await state.steps(page);
      await waitForAnimations(page);
      await page.screenshot({ path: path.join(COMPARE_DIR, `${state.file}.png`), fullPage: true });
      if (state.deviation) test.info().annotations.push({ type: 'deviation', description: state.deviation });

      for (const key of state.blocks) {
        const block = pageBlock(page, key);
        await expect(block, `區塊 ${key} 應存在`).toHaveCount(1);
        const items = BLOCK_ORDER[key];
        const pos = await orderPositions(page, key, items);
        const missing = items.filter((_, i) => pos[i] < 0).map((it) => it.text ?? it.css);
        expect(missing, `區塊 ${key} 缺少子區塊`).toEqual([]);
        const sorted = [...pos].sort((a, b) => a - b);
        expect(pos, `區塊 ${key} 子區塊順序（${items.map((it) => it.text ?? it.css).join(' → ')}）`).toEqual(sorted);
        expect(new Set(pos).size, `區塊 ${key} 子區塊應各自不同`).toBe(pos.length);
      }

      for (const [key, texts] of Object.entries(state.texts) as [PageKey, string[]][]) {
        const inner = normalizeText(await pageBlock(page, key).innerText());
        const missing = texts.filter((t) => !inner.includes(normalizeText(t)));
        expect(missing, `區塊 ${key} 缺少文案（innerText：${inner.slice(0, 300)}…）`).toEqual([]);
      }

      await state.asserts(page);
    });
  }
});
