/**
 * 環境設定（T011；§CP-3、research R7）
 *
 * 依據：`VITE_DATA_BASE_URL`（資料位置，預設 `${BASE_URL}data/`，確保結尾 `/`）；
 *       環境別以 Vite `MODE` 判斷（`isProduction`）。
 *
 * ISP 分割表（§TR-7；風險分級 Experimental → 主要流程範圍，涵蓋準則：Base Choice）
 * Base：VITE_DATA_BASE_URL 未設定、BASE_URL='/'、MODE='production'
 *
 * | 特徵                         | blocks                                         | base     | 對應案例         |
 * | :--------------------------- | :--------------------------------------------- | :------- | :--------------- |
 * | C1 VITE_DATA_BASE_URL        | 未設定／空字串／有設定且有結尾斜線／有設定缺結尾斜線 | 未設定   | CF-1、CF-2、CF-3、CF-4 |
 * | C2 BASE_URL                  | '/'／子路徑有結尾斜線／子路徑缺結尾斜線         | '/'      | CF-1、CF-5、CF-6 |
 * | C3 MODE                      | production／development／test                  | production | CF-7、CF-8、CF-9 |
 *
 * 範圍外（一次性宣告）：網址合法性檢查（資料位置由部署者設定，載入失敗由 FR-022 處理）。
 */
import { describe, expect, it } from 'vitest';
import { dataBaseUrl, isProduction, resolveDataBaseUrl, resolveIsProduction } from './config';

describe('resolveDataBaseUrl', () => {
  it('CF-1 C1=未設定、C2=/ → /data/', () => {
    expect(resolveDataBaseUrl({ BASE_URL: '/' })).toBe('/data/');
  });

  it('CF-2 C1=空字串 → 視同未設定，用預設', () => {
    expect(resolveDataBaseUrl({ BASE_URL: '/', VITE_DATA_BASE_URL: '' })).toBe('/data/');
  });

  it('CF-3 C1=有設定且有結尾斜線 → 原樣使用', () => {
    expect(
      resolveDataBaseUrl({ BASE_URL: '/', VITE_DATA_BASE_URL: 'https://cdn.example.com/shuihu/' }),
    ).toBe('https://cdn.example.com/shuihu/');
  });

  it('CF-4 C1=有設定缺結尾斜線 → 補上 /', () => {
    expect(
      resolveDataBaseUrl({ BASE_URL: '/', VITE_DATA_BASE_URL: 'https://cdn.example.com/shuihu' }),
    ).toBe('https://cdn.example.com/shuihu/');
  });

  it('CF-5 C2=子路徑有結尾斜線 → <base>data/', () => {
    expect(resolveDataBaseUrl({ BASE_URL: '/Outlaws/' })).toBe('/Outlaws/data/');
  });

  it('CF-6 C2=子路徑缺結尾斜線 → 仍為 <base>/data/', () => {
    expect(resolveDataBaseUrl({ BASE_URL: '/Outlaws' })).toBe('/Outlaws/data/');
  });
});

describe('resolveIsProduction', () => {
  it('CF-7 C3=production → true', () => {
    expect(resolveIsProduction('production')).toBe(true);
  });

  it('CF-8 C3=development → false', () => {
    expect(resolveIsProduction('development')).toBe(false);
  });

  it('CF-9 C3=test → false', () => {
    expect(resolveIsProduction('test')).toBe(false);
  });
});

describe('模組常數（取自 import.meta.env）', () => {
  it('vitest 環境下 dataBaseUrl 以 / 結尾、isProduction 為 false', () => {
    expect(dataBaseUrl.endsWith('/')).toBe(true);
    expect(isProduction).toBe(false);
  });
});
