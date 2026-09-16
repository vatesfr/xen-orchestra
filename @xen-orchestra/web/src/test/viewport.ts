import type { DetachedWindowAPI } from 'happy-dom'

declare global {
  interface Window {
    happyDOM: DetachedWindowAPI
  }
}

/**
 * `useUiStore` reads its `isSmall` / `isMedium` / `isLarge` flags from the
 * viewport, through `matchMedia`, which `happy-dom` answers from the width of
 * its window — so a test drives a responsive branch by resizing that window.
 *
 * The breakpoints are the ones the store declares: medium at 1024, large at 1440.
 */
const DEFAULT_WIDTH = 1024

function setViewportWidth(width: number) {
  window.happyDOM.setViewport({ width })
}

/** Narrower than the medium breakpoint, which is what `uiStore.isSmall` reports. */
export function givenSmallScreen() {
  setViewportWidth(DEFAULT_WIDTH - 1)
}

/**
 * Back to the width `happy-dom` starts a test file with. `src/test/setup.ts`
 * calls it after every test, so a resize never leaks into the next one.
 */
export function resetViewport() {
  setViewportWidth(DEFAULT_WIDTH)
}
