import { createBr } from '@/test/create-br.ts'
import { formatSpeed } from '@core/utils/speed.util.ts'
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

// The rates of the latest benchmark of `createTwiceBenchmarkedBr`
const LATEST_BR_BENCHMARK_RATES = { write: 100_000_000, read: 200_000_000 }

// The speeds of the latest benchmark of `createTwiceBenchmarkedBr`, formatted as the app shows them
export function getLatestBrBenchmarkSpeeds() {
  return { write: formatSpeed(LATEST_BR_BENCHMARK_RATES.write), read: formatSpeed(LATEST_BR_BENCHMARK_RATES.read) }
}

/**
 * A backup repository benchmarked twice: an older benchmark, then the latest one, of `LATEST_BR_BENCHMARK_RATES`.
 */
export function createTwiceBenchmarkedBr() {
  return createBr({
    benchmarks: [
      createBrBenchmark({ writeRate: 1_000_000, readRate: 2_000_000 }),
      createBrBenchmark({ writeRate: LATEST_BR_BENCHMARK_RATES.write, readRate: LATEST_BR_BENCHMARK_RATES.read }),
    ],
  })
}
