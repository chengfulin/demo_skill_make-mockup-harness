/**
 * 環境設定（§CP-3、research R7）：部署路徑與資料位置因環境而異，不得寫死。
 *
 * - `VITE_DATA_BASE_URL`：資料位置；未設定時預設 `${BASE_URL}data/`。
 * - 環境別以 Vite `MODE` 判斷。
 */

export interface DataUrlEnv {
  /** Vite `base`（由 `VITE_BASE_PATH` 決定） */
  BASE_URL: string;
  /** 資料位置（選填） */
  VITE_DATA_BASE_URL?: string;
}

function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

/** 解析資料位置，確保結尾 `/`。 */
export function resolveDataBaseUrl(env: DataUrlEnv): string {
  const configured = env.VITE_DATA_BASE_URL?.trim();
  if (configured) return withTrailingSlash(configured);
  return `${withTrailingSlash(env.BASE_URL)}data/`;
}

/** 以 Vite mode 判斷是否為正式環境。 */
export function resolveIsProduction(mode: string): boolean {
  return mode === 'production';
}

/** 6 個資料檔的基底網址（結尾必為 `/`）。 */
export const dataBaseUrl: string = resolveDataBaseUrl({
  BASE_URL: import.meta.env.BASE_URL,
  VITE_DATA_BASE_URL: import.meta.env.VITE_DATA_BASE_URL as string | undefined,
});

/** 是否為正式環境。 */
export const isProduction: boolean = resolveIsProduction(import.meta.env.MODE);
