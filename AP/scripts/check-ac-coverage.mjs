#!/usr/bin/env node
/**
 * AC 覆蓋檢查（T143、SC-001）：掃描 e2e/*.spec.ts 的測試名稱，核對
 * AC-01～AC-18、AC-P1～AC-P42、AC-S1～AC-S27 共 87 個編號全部出現。
 * 缺漏時列出並以非零結束。
 *
 * 用法（於 AP/）：node scripts/check-ac-coverage.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const e2eDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'e2e');

function range(prefix, from, to, pad = 0) {
  const ids = [];
  for (let i = from; i <= to; i += 1) ids.push(`${prefix}${String(i).padStart(pad, '0')}`);
  return ids;
}

const expected = [
  ...range('AC-', 1, 18, 2),
  ...range('AC-P', 1, 42),
  ...range('AC-S', 1, 27),
];

// 只取 test(...)／test.only(...)／test.skip(...) 等呼叫的第一個字串參數（測試名稱）。
const TEST_NAME = /\btest(?:\.(?:only|skip|fixme|fail|slow))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
const AC_ID = /\bAC-(?:P|S)?\d+\b/g;

const files = readdirSync(e2eDir).filter((f) => f.endsWith('.spec.ts')).sort();
/** @type {Map<string, Set<string>>} 編號 → 出現的檔案 */
const found = new Map();

for (const file of files) {
  const source = readFileSync(join(e2eDir, file), 'utf8');
  for (const match of source.matchAll(TEST_NAME)) {
    for (const id of match[2].match(AC_ID) ?? []) {
      if (!found.has(id)) found.set(id, new Set());
      found.get(id).add(file);
    }
  }
}

const missing = expected.filter((id) => !found.has(id));
const covered = expected.length - missing.length;

console.log(`AC coverage: ${covered}/${expected.length} (scanned ${files.length} spec files)`);
if (missing.length > 0) {
  console.error(`Missing AC IDs in e2e test names (${missing.length}):`);
  for (const id of missing) console.error(`  - ${id}`);
  process.exit(1);
}
console.log('All AC IDs are covered by e2e test names.');
