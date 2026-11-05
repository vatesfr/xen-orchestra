import type { XoBackupRepositoryBenchmark } from '@vates/types'

/**
 * Builds a fully-populated `XoBackupRepositoryBenchmark` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createBrBenchmark(overrides: Partial<XoBackupRepositoryBenchmark> = {}): XoBackupRepositoryBenchmark {
  return {
    readRate: 200_000_000,
    writeRate: 100_000_000,
    timestamp: 1_700_000_000_000,
    ...overrides,
  }
}
