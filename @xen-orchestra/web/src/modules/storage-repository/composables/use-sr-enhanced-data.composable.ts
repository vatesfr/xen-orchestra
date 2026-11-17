import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export type SrFilterableData = FrontXoSr & {
  poolName: string
}

export function useSrEnhancedData(rawSrs: MaybeRefOrGetter<FrontXoSr[]>) {
  const srs = toComputed(rawSrs)

  const { getPoolById } = useXoPoolCollection()

  const filterableSrs = computed<SrFilterableData[]>(() =>
    srs.value.map(sr => ({
      ...sr,
      poolName: getPoolById(sr.$pool)?.name_label ?? '',
    }))
  )

  return {
    filterableSrs,
  }
}
