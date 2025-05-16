import type { XoHost } from '@/types/xo/host.type.ts'
import type { XoPool } from '@/types/xo/pool.type.ts'
import type { XoVm } from '@/types/xo/vm.type.ts'
import { type GRANULARITY, RRD_STEP_FROM_STRING } from '@/utils/rest-api-stats.ts'
import { useFetch, useIntervalFn } from '@vueuse/core'
import type { MaybeRefOrGetter } from '@vueuse/shared'
import { toValue } from 'vue'

export function useFetchStats(
  entityType: 'hosts' | 'vms' | 'pools',
  id: MaybeRefOrGetter<XoVm['id'] | XoHost['id'] | XoPool['id']>,
  granularity: MaybeRefOrGetter<GRANULARITY>
) {
  const result = useFetch(() => `/rest/v0/${entityType}/${toValue(id)}/stats?granularity=${toValue(granularity)}`, {
    immediate: false,
    refetch: true,
    beforeFetch({ options }) {
      options.credentials = 'include'

      return { options }
    },
  })
    .get()
    .json()

  useIntervalFn(
    () => result.execute(),
    () => RRD_STEP_FROM_STRING[toValue(granularity)] * 1000,
    { immediateCallback: true }
  )

  return {
    data: result.data,
    error: result.error,
    isFetching: result.isFetching,
  }
}
