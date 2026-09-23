import {
  type BackupRepositoryBenchmarkResult,
  useXoBackupRepositoryBenchmarkJob,
} from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref, watch } from 'vue'

export function useXoBackupRepositoryBenchmark(rawBr: MaybeRefOrGetter<FrontXoBackupRepository>) {
  const br = toComputed(rawBr)

  const {
    run,
    canRun: canBenchmark,
    isRunning: isBenchmarking,
    errorMessage: benchmarkErrorMessage,
  } = useXoBackupRepositoryBenchmarkJob(br)

  const manualBenchmark = ref<BackupRepositoryBenchmarkResult>()

  const benchmark = computed(() => manualBenchmark.value ?? br.value.benchmarks?.at(-1))

  async function runBenchmark() {
    try {
      const { readRate, writeRate } = await run()

      manualBenchmark.value = { readRate, writeRate }
    } catch (error) {
      console.error('Error when benchmarking backup repository:', error)
    }
  }

  watch(
    () => br.value.id,
    () => {
      manualBenchmark.value = undefined
    }
  )

  return { benchmark, runBenchmark, canBenchmark, isBenchmarking, benchmarkErrorMessage }
}
