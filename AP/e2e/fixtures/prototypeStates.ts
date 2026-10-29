/**
 * Prototype 並列比對的 21 個狀態（T139；SC-003；plan「Prototype 並列比對 E2E」）。
 *
 * 來源：contracts/ui-contracts.md「21 個狀態的重現步驟與 DOM 斷言」；名稱與順序同 handoff-notes.md「截圖索引」。
 * 每個狀態：
 *   - `file`：截圖檔名（不含 `.png`），與 `.specify/context/shuihu-timeline/v2/prototype/screens/` 同名；
 *   - `steps`：只用 UI 操作，從新頁 `/#timeline`、未設篩選開始（開頁由 prototype-compare.spec.ts 負責）；
 *   - `blocks`：要檢查區塊順序的 `data-page`（順序規則見 `BLOCK_ORDER`）；
 *   - `texts`：正規化（`normalizeText`）後必須出現在該區塊 `innerText` 的字串；
 *   - `asserts`：狀態斷言（結果數、已選標籤、`aria-pressed`／`aria-selected`、`data-dim` 數等）。
 * 斷言以 spec 為準（已核准偏離 D-1、D-3、D-4、D-5、G-7、G-11），不以 Prototype 為準：
 * #20、#21 圖例說明依 D-4 斷言新文案（並列目視不計逐字一致）。
 *
 * 只透過 ui-contracts 列出的 `data-page`／`data-testid`／role／label 與既有 AC E2E 已用的 class 定位。
 */
import type { Locator, Page } from '@playwright/test';
import {
  expect,
  normalizeText,
  openCharacterInfo,
  pageBlock,
  pickCharacter,
  resultCount,
  selectArc,
  switchView,
  type PageKey,
} from './app';

/** 區塊順序的一項：區塊內第一個符合 `css` 的元素；給 `text` 時取「自身含該文字、子元素都不含」的最深元素。 */
export interface OrderItem {
  css: string;
  text?: string;
}

/**
 * 各 `data-page` 區塊依 ui-contracts「區塊順序」應依序出現的子區塊（文件順序嚴格遞增）。
 * S2 第三項為「事件車道或空狀態」；S6 為 SVG → 圖例列（ui-contracts S6 ①②）。
 */
export const BLOCK_ORDER: Record<PageKey, OrderItem[]> = {
  S1: [
    { css: 'input[type="search"]' },
    { css: 'button[aria-pressed]', text: '天罡' },
    { css: 'button[aria-pressed]', text: '地煞' },
    { css: 'select[aria-label="大節"]' },
    { css: '[data-testid="char-list"]' },
    { css: '[data-testid="selected-bar"]' },
    { css: '[data-testid="result-count"]' },
    { css: '[role="tablist"]' },
  ],
  S2: [{ css: '.arcs' }, { css: '.ruler' }, { css: '.lanes, .empty' }],
  S3: [
    { css: '.dh .k' },
    { css: '.dh button[aria-label="關閉"]' },
    { css: 'h2' },
    { css: '.summary' },
    { css: 'h4', text: '回目' },
    { css: 'h4', text: '地點' },
    { css: 'h4', text: '參與角色' },
    { css: '.pn' },
  ],
  S4: [
    { css: '.dh .k' },
    { css: '.dh button[aria-label="關閉"]' },
    { css: 'h2' },
    { css: '[role="img"]' },
    { css: 'h4', text: '結局' },
    { css: 'button', text: '只看此角色' },
    { css: 'h4', text: '參與事件' },
    { css: 'h4', text: '人物關係' },
  ],
  S5: [
    { css: '[role="tablist"][aria-label="地圖範圍"]' },
    { css: '[data-testid="map"]' },
    { css: '[aria-label="章回範圍"]' },
    { css: '[data-testid="map-side"]' },
  ],
  S6: [
    { css: '[data-testid="graph"] svg[aria-label="角色關係圖"]' },
    { css: '[data-testid="graph"] *', text: '天罡' },
    { css: '[data-testid="graph"] *', text: '點人物看資料' },
  ],
};

export interface PrototypeState {
  /** 截圖索引序號（1～21） */
  no: number;
  /** 截圖檔名（不含 `.png`） */
  file: string;
  steps: (page: Page) => Promise<void>;
  blocks: PageKey[];
  texts: Partial<Record<PageKey, string[]>>;
  asserts: (page: Page) => Promise<void>;
  /** 與 Prototype 截圖不同、已核准的偏離（並列目視時不計） */
  deviation?: string;
}

// ---------- 共用定位 ----------

const chips = (page: Page): Locator => page.getByTestId('char-list').locator('button.pick[aria-pressed]');
const tags = (page: Page): Locator => page.getByTestId('selected-bar').locator('.tag');
const cards = (page: Page): Locator => page.getByTestId('timeline').getByTestId('event-card');
const eventDrawer = (page: Page): Locator => page.getByTestId('event-drawer');
const charDrawer = (page: Page): Locator => page.getByTestId('character-drawer');
const map = (page: Page): Locator => page.getByTestId('map');
const markers = (page: Page): Locator => map(page).locator('g.mk');
const side = (page: Page): Locator => page.getByTestId('map-side');
const graph = (page: Page): Locator => page.getByTestId('graph');
const graphNode = (page: Page, name: string): Locator =>
  graph(page).locator(`[role="button"][aria-label="${name} 角色資料"]`);
const graphNodes = (page: Page): Locator => graph(page).locator('[role="button"][aria-label$=" 角色資料"]');

const TIANGANG = [
  '宋江', '盧俊義', '吳用', '公孫勝', '林沖', '魯智深', '武松', '楊志', '李逵',
  '燕青', '花榮', '柴進', '阮小二', '阮小七', '戴宗', '石秀', '楊雄',
];
const ARCS = [
  '誤走妖魔・魯智深與林沖', '智取生辰綱・晁蓋上山', '武松', '宋江上山', '三打祝家莊', '高唐州與大破連環馬',
  '曾頭市與盧俊義上山', '英雄排座次與招安', '征遼', '征田虎・征王慶', '征方臘', '魂聚蓼兒洼',
];
const LEGEND_FULL = '點人物看資料，點「＋」加入篩選；未選角色時以宋江為中心';
const LEGEND_SELECTED = '點人物看資料，點「＋」加入篩選';

/** 已選標籤姓名（去掉 × 鈕） */
async function tagNames(page: Page): Promise<string[]> {
  return tags(page).evaluateAll((els) =>
    els.map((el) => (el.firstChild?.textContent ?? '').trim()),
  );
}

async function expectTags(page: Page, names: string[]): Promise<void> {
  await expect(tags(page)).toHaveCount(names.length);
  expect(await tagNames(page)).toEqual(names);
}

async function search(page: Page, q: string): Promise<void> {
  await pageBlock(page, 'S1').getByRole('searchbox', { name: '搜尋角色' }).fill(q);
}

async function openEventCard(page: Page, title: string): Promise<void> {
  await cards(page).filter({ has: page.getByText(title, { exact: true }) }).click();
  await expect(eventDrawer(page).getByRole('heading', { level: 2 })).toHaveText(title);
}

/** 事件明細參與角色中，某人是否標「已在篩選中」 */
const participant = (page: Page, name: string): Locator =>
  eventDrawer(page).locator('.person', { has: page.getByRole('button', { name, exact: true }) });

/** 角色資料「人物關係」中對方的按鈕（含關係類型） */
async function expectRelation(page: Page, name: string, type: string): Promise<void> {
  const btn = charDrawer(page)
    .locator('.sec', { has: page.getByRole('heading', { name: '人物關係' }) })
    .getByRole('button')
    .filter({ hasText: name });
  await expect(btn.first()).toBeVisible();
  await expect(btn.filter({ hasText: type })).toHaveCount(1);
}

/** 節點圓心相對 SVG 中心的距離（px） */
async function distanceToSvgCenter(page: Page, name: string): Promise<number> {
  const svg = await graph(page).locator('svg[aria-label="角色關係圖"]').boundingBox();
  const node = await graphNode(page, name).boundingBox();
  if (!svg || !node) throw new Error(`找不到關係圖或節點「${name}」`);
  return Math.hypot(svg.x + svg.width / 2 - (node.x + node.width / 2), svg.y + svg.height / 2 - (node.y + node.height / 2));
}

/** 各節點是否淡出（節點圓或其祖先帶 `data-dim="true"`） */
async function dimmedNodes(page: Page): Promise<{ dim: string[]; clear: string[] }> {
  return graphNodes(page).evaluateAll((els) => {
    const dim: string[] = [];
    const clear: string[] = [];
    for (const el of els) {
      const name = (el.getAttribute('aria-label') ?? '').replace(/ 角色資料$/, '');
      (el.closest('[data-dim="true"]') ? dim : clear).push(name);
    }
    return { dim, clear };
  });
}

/** 圖例說明（圖例列中含「點人物看資料」的最深元素）正規化文字 */
async function legendCaption(page: Page): Promise<string> {
  const texts = await graph(page)
    .locator('*')
    .evaluateAll((els) =>
      els
        .filter(
          (el) =>
            (el.textContent ?? '').includes('點人物看資料') &&
            ![...el.children].some((c) => (c.textContent ?? '').includes('點人物看資料')),
        )
        .map((el) => el.textContent ?? ''),
    );
  expect(texts).toHaveLength(1);
  return normalizeText(texts[0]);
}

async function labelOverlaps(page: Page): Promise<string[]> {
  const boxes = await map(page)
    .locator('g.mk text.l')
    .evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return { name: n.textContent ?? '', x: r.x, y: r.y, w: r.width, h: r.height };
      }),
    );
  const hits: string[] = [];
  const e = 0.5;
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.x + e < b.x + b.w && b.x + e < a.x + a.w && a.y + e < b.y + b.h && b.y + e < a.y + a.h)
        hits.push(`${a.name}/${b.name}`);
    }
  return hits;
}

// ---------- 21 個狀態 ----------

const openShandong = async (page: Page): Promise<void> => {
  await switchView(page, '地圖');
  const tab = pageBlock(page, 'S5').getByRole('tablist', { name: '地圖範圍' }).getByRole('tab', { name: '山東', exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
};

const linChongEventSteps = async (page: Page): Promise<void> => {
  await pickCharacter(page, '林沖');
  await openEventCard(page, '大鬧野豬林');
};

const linChongGraphSteps = async (page: Page): Promise<void> => {
  await pickCharacter(page, '林沖');
  await switchView(page, '關係圖');
};

export const PROTOTYPE_STATES: PrototypeState[] = [
  {
    no: 1,
    file: 'S1-01-預設未選角色',
    steps: async () => {},
    blocks: ['S1', 'S2'],
    texts: { S1: ['未選角色，顯示全部角色的事件', '共 54 個事件'] },
    asserts: async (page) => {
      await expect(chips(page)).toHaveCount(22);
      await expect(pageBlock(page, 'S1').getByRole('searchbox', { name: '搜尋角色' })).toHaveAttribute(
        'placeholder',
        '搜尋姓名或綽號，例如：黑旋風',
      );
      await expect(tags(page)).toHaveCount(0);
    },
  },
  {
    no: 2,
    file: 'S1-02-搜尋豹子頭',
    steps: (page) => search(page, '豹子頭'),
    blocks: ['S1'],
    texts: { S1: ['共 54 個事件'] },
    asserts: async (page) => {
      await expect(chips(page)).toHaveCount(1);
      await expect(chips(page).locator('.nm')).toHaveText('林沖');
      await expect(chips(page).locator('.nk')).toHaveText('豹子頭');
      expect(await resultCount(page)).toBe(54);
    },
  },
  {
    no: 3,
    file: 'S1-03-搜尋無結果',
    steps: (page) => search(page, '孫悟空'),
    blocks: ['S1'],
    texts: { S1: ['找不到符合的角色'] },
    asserts: async (page) => {
      await expect(chips(page)).toHaveCount(0);
    },
  },
  {
    no: 4,
    file: 'S1-04-天罡快選',
    steps: async (page) => {
      await pageBlock(page, 'S1').getByRole('button', { name: '天罡', exact: true }).click();
    },
    blocks: ['S1'],
    texts: { S1: ['已選', '清除全部', '共 52 個事件'] },
    asserts: async (page) => {
      await expectTags(page, TIANGANG);
      await expect(pageBlock(page, 'S1').getByRole('button', { name: '天罡', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(await resultCount(page)).toBe(52);
    },
  },
  {
    no: 5,
    file: 'S2-01-全書時間軸',
    steps: async () => {},
    blocks: ['S2'],
    texts: { S2: [...ARCS, '洪太尉誤走妖魔', '（無收錄角色）'] },
    asserts: async (page) => {
      const tl = page.getByTestId('timeline');
      await expect(tl.locator('.arcs .arc b')).toHaveText(ARCS);
      await expect(tl.locator('.ruler .tick:not(.minor)')).toHaveText([
        '1', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110', '120',
      ]);
      await expect(cards(page)).toHaveCount(54);
      await expect(cards(page).filter({ hasText: '洪太尉誤走妖魔' })).toContainText('（無收錄角色）');
    },
  },
  {
    no: 6,
    file: 'S2-02-選林沖',
    steps: (page) => pickCharacter(page, '林沖'),
    blocks: ['S1', 'S2'],
    texts: { S1: ['已選', '林沖', '共 10 個事件'] },
    asserts: async (page) => {
      await expectTags(page, ['林沖']);
      expect(await resultCount(page)).toBe(10);
      await expect(cards(page)).toHaveCount(10);
      // 每張卡的第一個頭像為林沖且帶朱色外框（AC-P5）
      await expect(cards(page).locator('.avs .av:first-child.ring')).toHaveCount(10);
      await expect(cards(page).locator('.av.ring')).toHaveCount(10);
    },
  },
  {
    no: 7,
    file: 'S2-03-大節三打祝家莊',
    steps: (page) => selectArc(page, '三打祝家莊'),
    blocks: ['S2'],
    texts: { S2: ['三打祝家莊', '43–50'] },
    asserts: async (page) => {
      const tl = page.getByTestId('timeline');
      await expect(tl.locator('.arcs .arc')).toHaveCount(1);
      await expect(tl.locator('.arcs .arc b')).toHaveText('三打祝家莊');
      await expect(tl.locator('.arcs .arc span')).toHaveText('43–50');
      await expect(tl.locator('.ruler .tick:not(.minor)')).toHaveText(['43', '50']);
      await expect(cards(page)).toHaveCount(4);
      expect((await cards(page).locator('.t').allTextContents()).sort()).toEqual(
        ['沂嶺殺四虎', '楊雄石秀結義・翠屏山', '火燒祝家店', '三打祝家莊'].sort(),
      );
    },
  },
  {
    no: 8,
    file: 'S2-04-空狀態',
    steps: async (page) => {
      await selectArc(page, '誤走妖魔・魯智深與林沖');
      await pickCharacter(page, '王英');
    },
    blocks: ['S2'],
    texts: { S2: ['沒有符合條件的事件', '目前的角色與大節組合下沒有事件。', '清除篩選'], S1: ['共 0 個事件'] },
    asserts: async (page) => {
      expect(await resultCount(page)).toBe(0);
      await expect(cards(page)).toHaveCount(0);
      await expect(pageBlock(page, 'S2').getByRole('button', { name: '清除篩選', exact: true })).toBeVisible();
    },
  },
  {
    no: 9,
    file: 'S3-01-事件明細大鬧野豬林',
    steps: linChongEventSteps,
    blocks: ['S3'],
    texts: {
      S3: [
        '事件 · 誤走妖魔・魯智深與林沖',
        '大鬧野豬林',
        '第 8 回',
        '大節 誤走妖魔・魯智深與林沖',
        '野豬林 · 在地圖上看',
        '← 林沖誤入白虎堂',
        '棒打洪教頭 →',
      ],
    },
    asserts: async (page) => {
      const d = eventDrawer(page);
      // 回目列「<第八回> <回目>」：回次與回目分屬兩個元素，以列為單位比對
      await expect(d.locator('.huimu li')).toHaveCount(1);
      expect(normalizeText(await d.locator('.huimu li span').innerText())).toBe('第八回');
      await expect(d.locator('.huimu li')).toContainText('林教頭刺配滄州道 魯智深大鬧野豬林');
      await expect(participant(page, '林沖').locator('.added')).toHaveText('已在篩選中');
      await expect(d.locator('.added')).toHaveCount(1);
      await expectTags(page, ['林沖']);
    },
  },
  {
    no: 10,
    file: 'S3-02-點頭像加入魯智深',
    steps: async (page) => {
      await linChongEventSteps(page);
      await eventDrawer(page).getByRole('button', { name: '將 魯智深 加入篩選', exact: true }).click();
    },
    blocks: ['S1', 'S3'],
    texts: { S1: ['已選', '林沖', '魯智深', '共 16 個事件'], S3: ['大鬧野豬林'] },
    asserts: async (page) => {
      await expect(eventDrawer(page)).toBeVisible();
      await expect(participant(page, '林沖').locator('.added')).toHaveText('已在篩選中');
      await expect(participant(page, '魯智深').locator('.added')).toHaveText('已在篩選中');
      await expectTags(page, ['林沖', '魯智深']);
      expect(await resultCount(page)).toBe(16);
    },
  },
  {
    no: 11,
    file: 'S4-01-角色資料林沖',
    steps: (page) => openCharacterInfo(page, '林沖'),
    blocks: ['S4'],
    texts: {
      S4: ['林沖', '綽號 豹子頭', '天雄星・第 6 位・天罡', '登場 7', '上梁山 11', '結局 119', '只看此角色', '參與事件（10）', '人物關係'],
    },
    asserts: async (page) => {
      await expect(charDrawer(page).getByRole('heading', { level: 2 })).toHaveText('林沖');
      await expectRelation(page, '魯智深', '結義');
      await expectRelation(page, '高俅', '仇敵');
      // 「i」不改變選取（AC-S12）
      await expect(chips(page).filter({ hasText: '林沖' })).toHaveAttribute('aria-pressed', 'false');
    },
  },
  {
    no: 12,
    file: 'S4-02-角色資料晁蓋非一百單八將',
    steps: (page) => openCharacterInfo(page, '晁蓋'),
    blocks: ['S4'],
    texts: { S4: ['晁蓋', '綽號 托塔天王', '非一百單八將', '登場 14', '上梁山 20', '結局 60', '參與事件（6）'] },
    asserts: async (page) => {
      const label = (await charDrawer(page).locator('.stbar[role="img"]').getAttribute('aria-label')) ?? '';
      expect(label).toContain('未登場 13 回，在野 6 回，已上梁山 40 回，已死亡或離散 61 回');
    },
  },
  {
    no: 13,
    file: 'S4-03-角色資料高俅全書在野',
    steps: (page) => openCharacterInfo(page, '高俅'),
    blocks: ['S4'],
    texts: { S4: ['高俅', '非一百單八將', '登場 2', '參與事件（5）'] },
    asserts: async (page) => {
      const d = charDrawer(page);
      const marks = (await d.locator('.stmk').allInnerTexts()).map(normalizeText);
      expect(marks).toEqual(['登場2']);
      const label = (await d.locator('.stbar[role="img"]').getAttribute('aria-label')) ?? '';
      expect(label).toContain('未登場 1 回，在野 119 回');
      for (const name of ['林沖', '宋江', '楊志']) await expectRelation(page, name, '仇敵');
    },
  },
  {
    no: 14,
    file: 'S5-01-全圖預設',
    steps: (page) => switchView(page, '地圖'),
    blocks: ['S5'],
    texts: {
      S5: [
        '山東 · 點此放大',
        '示意，非精確測繪',
        '1 個事件無法標示地點',
        '章回刻度 · 第 1–120 回，共 54 個事件，直線標出各事件的起始回',
        '地點',
        '目前篩選',
        '只選一位角色時，會以虛線畫出他的行跡。',
      ],
    },
    asserts: async (page) => {
      await expect(page).toHaveURL(/#map$/);
      await expect(
        pageBlock(page, 'S5').getByRole('tablist', { name: '地圖範圍' }).getByRole('tab', { name: '全圖', exact: true }),
      ).toHaveAttribute('aria-selected', 'true');
      await expect(markers(page)).toHaveCount(32);
    },
  },
  {
    no: 15,
    file: 'S5-02-單一角色行跡林沖',
    steps: async (page) => {
      await pickCharacter(page, '林沖');
      await switchView(page, '地圖');
    },
    blocks: ['S5'],
    texts: { S5: ['林沖的行跡', '紅色虛線依章回順序連接地點，數字為移動順序。', '共 10 個事件，直線標出各事件的起始回'] },
    asserts: async (page) => {
      await expect(markers(page)).toHaveCount(6);
      await expect(map(page).locator('polyline.trail')).toHaveCount(1);
      await expect(map(page).locator('.trailno')).toHaveText(['1', '2', '3', '4', '5', '6', '7']);
      expect(await resultCount(page)).toBe(10);
    },
  },
  {
    no: 16,
    file: 'S5-03-多角色無行跡與無法定位提示',
    steps: async (page) => {
      await pickCharacter(page, '林沖');
      await pickCharacter(page, '宋江');
      await switchView(page, '地圖');
    },
    blocks: ['S5'],
    texts: { S5: ['1 個事件無法標示地點', '選了多位角色時只標出地點，不畫行跡線。只選一位角色可看行跡。', '共 31 個事件，直線標出各事件的起始回'] },
    asserts: async (page) => {
      await expect(map(page).locator('polyline.trail')).toHaveCount(0);
      expect(await resultCount(page)).toBe(31);
    },
  },
  {
    no: 17,
    file: 'S5-04-山東放大',
    steps: openShandong,
    blocks: ['S5'],
    texts: { S5: ['示意，非精確測繪 · 山東範圍外的地點不顯示'] },
    asserts: async (page) => {
      await expect(markers(page)).toHaveCount(15);
      await expect(map(page).locator('g.mk[data-place="東京"]')).toHaveCount(0);
      await expect(map(page).locator('svg[aria-label="山東範圍示意地圖"]')).toBeVisible();
      await expect(map(page).locator('svg text', { hasText: '黃海' })).toHaveCount(1);
      expect(await labelOverlaps(page)).toEqual([]);
    },
  },
  {
    no: 18,
    file: 'S5-05-點地點列出事件',
    steps: async (page) => {
      await openShandong(page);
      // 點圓（g 外框中心可能落在標籤字形間的空白）
      await map(page).locator('g.mk[data-place="梁山泊"] circle.o').click();
      await expect(side(page).locator('.panel').first().getByRole('heading')).toHaveText('梁山泊');
    },
    blocks: ['S5'],
    texts: { S5: ['梁山泊', '7 個事件', '晁蓋梁山小奪泊', '全夥受招安'] },
    asserts: async (page) => {
      const panel = side(page).locator('.panel').first();
      await expect(panel.locator('.elist b')).toHaveText([
        '晁蓋梁山小奪泊',
        '小李廣梁山射雁',
        '一丈青配王英',
        '時遷盜甲・大破連環馬',
        '忠義堂排座次',
        '三敗高太尉',
        '全夥受招安',
      ]);
      await expect(map(page).locator('g.mk[data-place="梁山泊"]')).toHaveClass(/\bhi\b/);
      await expect(map(page).locator('g.mk.hi')).toHaveCount(1);
    },
  },
  {
    no: 19,
    file: 'S6-01-未選角色以宋江為中心',
    steps: (page) => switchView(page, '關係圖'),
    blocks: ['S6'],
    texts: { S6: ['天罡', '地煞', '其他', '結義', '主僕', '兄弟', '夫妻', '仇敵', LEGEND_FULL] },
    asserts: async (page) => {
      await expect(page).toHaveURL(/#graph$/);
      await expect(graphNodes(page)).toHaveCount(22);
      await expect(graph(page).locator('[data-dim="true"]')).toHaveCount(0);
      expect(await distanceToSvgCenter(page, '宋江')).toBeLessThan(3);
      expect(await legendCaption(page)).toBe(LEGEND_FULL);
      expect(normalizeText(await graph(page).innerText())).not.toContain('師徒');
    },
  },
  {
    no: 20,
    file: 'S6-02-選林沖一層關係',
    steps: linChongGraphSteps,
    blocks: ['S6'],
    texts: { S6: [LEGEND_SELECTED] },
    asserts: async (page) => {
      expect(await distanceToSvgCenter(page, '林沖')).toBeLessThan(3);
      const { dim, clear } = await dimmedNodes(page);
      expect(clear.sort()).toEqual(['林沖', '魯智深', '高俅'].sort());
      expect(dim).toHaveLength(19);
      await expect(graph(page).locator('[aria-label="將 林沖 加入篩選"]')).toHaveCount(0);
      // D-4：已選角色時圖例說明不含「；未選角色時以宋江為中心」（與截圖不同處）
      expect(await legendCaption(page)).toBe(LEGEND_SELECTED);
    },
    deviation: 'D-4：圖例說明為「點人物看資料，點「＋」加入篩選」，截圖仍顯示「；未選角色時以宋江為中心」',
  },
  {
    no: 21,
    file: 'S6-03-點節點開角色資料',
    steps: async (page) => {
      await linChongGraphSteps(page);
      await graphNode(page, '魯智深').click();
      await expect(pageBlock(page, 'S4')).toBeVisible();
    },
    blocks: ['S6', 'S4'],
    texts: { S4: ['魯智深', '天孤星・第 13 位・天罡', '參與事件（10）'], S6: [LEGEND_SELECTED] },
    asserts: async (page) => {
      await expect(charDrawer(page).getByRole('heading', { level: 2 })).toHaveText('魯智深');
      await expectRelation(page, '林沖', '結義');
      expect(await legendCaption(page)).toBe(LEGEND_SELECTED);
    },
    deviation: 'D-4：圖例說明同 #20，與截圖不同',
  },
];
