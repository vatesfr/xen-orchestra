import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { formatSpeed } from '@core/utils/speed.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoBackupRepositoryBenchmark(rawBr: MaybeRefOrGetter<FrontXoBackupRepository>) {
  const br = toComputed(rawBr)

  const benchmark = computed(() => br.value.benchmarks?.at(-1))

  function useFormattedRate(rate: 'readRate' | 'writeRate') {
    return computed(() => (benchmark.value === undefined ? undefined : formatSpeed(benchmark.value[rate])))
  }

  const writeSpeed = useFormattedRate('writeRate')

  const readSpeed = useFormattedRate('readRate')

  return { benchmark, writeSpeed, readSpeed }
}
