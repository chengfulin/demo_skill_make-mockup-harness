import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/**
 * window.matchMedia stub：預設淺色、寬 >720px（即 `(max-width: …)`、
 * `(prefers-color-scheme: dark)`、`(prefers-reduced-motion: reduce)` 皆不成立）。
 * 測試可以 `vi.spyOn(window, 'matchMedia')` 或重新指定 `window.matchMedia` 覆寫。
 */
function createMatchMedia(matches: (query: string) => boolean = () => false) {
  return (query: string): MediaQueryList => ({
    matches: matches(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  });
}

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function installStubs() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: createMatchMedia(),
  });
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: ResizeObserverStub,
  });
}

installStubs();

afterEach(() => {
  cleanup();
  // 每測還原預設 stub，避免前一個測試的覆寫外溢。
  installStubs();
});
