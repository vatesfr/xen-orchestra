import type { XapiHostStats } from '@vates/types/common'

/**
 * Builds a minimal `XapiHostStats` for use in tests. Pass `overrides` to tweak
 * only the fields relevant to the case under test (usually `stats`).
 */
export function createHostStats(overrides: Partial<XapiHostStats> = {}): XapiHostStats {
  return {
    endTimestamp: 1000,
    interval: 10,
    stats: {},
    ...overrides,
  }
}
