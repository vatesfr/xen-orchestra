import type { XapiVmStats } from '@vates/types/common'

/**
 * Builds a minimal `XapiVmStats` for use in tests. Pass `overrides` to tweak
 * only the fields relevant to the case under test (usually `stats`).
 */
export function createVmStats(overrides: Partial<XapiVmStats> = {}): XapiVmStats {
  return {
    endTimestamp: 1000,
    interval: 10,
    stats: {},
    ...overrides,
  }
}
