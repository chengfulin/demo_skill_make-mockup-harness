// @ts-check
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * 分層規則（plan「元件分層」§FE-4）以 no-restricted-imports 落實；
 * 禁用 dangerouslySetInnerHTML（§FE-5）；禁止 src/** 直接 import public/data/*.json（FR-021）。
 *
 * 注意：ESLint flat config 中，同一規則在多個區塊命中同一檔時「後者覆寫前者」，
 * 因此每個分層區塊都把 FR-021 的資料檔禁令一併列入，避免被覆寫掉。
 */

const dataJsonPattern = {
  group: ['**/public/data/*.json', '**/public/data/**'],
  message: '不得直接 import public/data/*.json；資料一律經 src/data/loadDataset 載入（FR-021）。',
};

const domainPatterns = [
  {
    group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
    message: 'src/domain/** 是純函式層，不得 import React（§FE-4）。',
  },
  {
    group: [
      '**/components', '**/components/**',
      '**/containers', '**/containers/**',
      '**/state', '**/state/**',
      '**/data', '**/data/**',
    ],
    message: 'src/domain/** 不得依賴 components／containers／state／data（§FE-4）。',
  },
];

const componentPatterns = [
  {
    group: [
      '**/containers', '**/containers/**',
      '**/state', '**/state/**',
      '**/data', '**/data/**',
    ],
    message: 'src/components/** 是展示元件，只吃 props，不得依賴 containers／state／data（§FE-4）。',
  },
];

const testFiles = ['src/**/*.test.{ts,tsx}', 'src/test-utils/**'];

export default tseslint.config(
  {
    ignores: ['node_modules/', 'dist/', 'test-results/', 'playwright-report/', 'coverage/'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: '禁用 dangerouslySetInnerHTML；文字一律由 React 轉義輸出（§FE-5）。',
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: testFiles,
    rules: {
      'no-restricted-imports': ['error', { patterns: [dataJsonPattern] }],
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    ignores: testFiles,
    rules: {
      'no-restricted-imports': ['error', { patterns: [...domainPatterns, dataJsonPattern] }],
    },
  },
  {
    // 測試檔可 import 測試工具，但仍不得讓 domain 依賴 React 或上層。
    files: ['src/domain/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: domainPatterns }],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: testFiles,
    rules: {
      'no-restricted-imports': ['error', { patterns: [...componentPatterns, dataJsonPattern] }],
    },
  },
);
