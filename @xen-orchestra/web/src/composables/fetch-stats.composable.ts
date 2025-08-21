import { type GRANULARITY, RRD_STEP_FROM_STRING } from '@/utils/rest-api-stats.ts'
import type { XoHost, XoPool, XoVm } from '@vates/types'
import type { XapiHostStats, XapiPoolStats, XapiVmStats } from '@vates/types/common'
import { useFetch, useIntervalFn } from '@vueuse/core'
import type { MaybeRefOrGetter } from '@vueuse/shared'
import { type ShallowRef, toValue } from 'vue'

type StatsByObjectType = {
  host: { stats: XapiHostStats; id: XoHost['id'] }
  vm: { stats: XapiVmStats; id: XoVm['id'] }
  pool: { stats: XapiPoolStats; id: XoPool['id'] }
}

export function useFetchStats<T extends keyof StatsByObjectType>(
  objectType: T,
  id: MaybeRefOrGetter<StatsByObjectType[T]['id']>,
  granularity: MaybeRefOrGetter<GRANULARITY>
): {
  data: ShallowRef<StatsByObjectType[T]['stats']>
  error: ShallowRef<any>
  isFetching: Readonly<ShallowRef<boolean>>
} {
  const result = useFetch(() => `/rest/v0/${objectType}s/${toValue(id)}/stats?granularity=${toValue(granularity)}`, {
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
