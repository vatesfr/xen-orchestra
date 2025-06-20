import { type GRANULARITY, RRD_STEP_FROM_STRING, type XapiStatsResponse } from '@/libs/xapi-stats'
import type { XenApiHost, XenApiVm } from '@/libs/xen-api/xen-api.types'
import type { XapiHostStatsRaw, XapiVmStatsRaw } from '@vates/types/common'
import { type Pausable, promiseTimeout, useTimeoutPoll } from '@vueuse/core'
import { computed, type ComputedRef, onUnmounted, ref, type Ref } from 'vue'

export type Stat<T> = {
  canBeExpired: boolean
  id: string
  name: string
  stats: T | undefined
  pausable: Pausable
}

export type GetStats<
  T extends XenApiHost | XenApiVm,
  S extends XapiHostStatsRaw | XapiVmStatsRaw = T extends XenApiHost ? XapiHostStatsRaw : XapiVmStatsRaw,
> = (
  uuid: T['uuid'],
  granularity: GRANULARITY,
  ignoreExpired: boolean,
  opts: { abortSignal?: AbortSignal }
) => Promise<XapiStatsResponse<S> | undefined> | undefined

export type FetchedStats<
  T extends XenApiHost | XenApiVm,
  S extends XapiHostStatsRaw | XapiVmStatsRaw = T extends XenApiHost ? XapiHostStatsRaw : XapiVmStatsRaw,
> = {
  register: (object: T) => void
  unregister: (object: T) => void
  stats: ComputedRef<Stat<S>[]>
  timestampStart: ComputedRef<number>
  timestampEnd: ComputedRef<number>
}

export default function useFetchStats<
  T extends XenApiHost | XenApiVm,
  S extends XapiHostStatsRaw | XapiVmStatsRaw = T extends XenApiHost ? XapiHostStatsRaw : XapiVmStatsRaw,
>(getStats: GetStats<T, S>, granularity: GRANULARITY): FetchedStats<T, S> {
  const stats = ref(new Map()) as Ref<Map<string, Stat<S>>>
  const timestamp = ref<number[]>([0, 0])
  const abortController = new AbortController()

  const register = (object: T) => {
    const mapKey = `${object.uuid}-${granularity}`
    if (stats.value.has(mapKey)) {
      stats.value.get(mapKey)!.pausable.resume()
      return
    }

    const ignoreExpired = computed(() => !stats.value.has(mapKey))

    const pausable = useTimeoutPoll(
      async () => {
        const newStats = (await getStats(object.uuid, granularity, ignoreExpired.value, {
          abortSignal: abortController.signal,
        })) as XapiStatsResponse<S>

        if (newStats === undefined) {
          return
        }

        timestamp.value = [
          newStats.endTimestamp -
            RRD_STEP_FROM_STRING[granularity] * ((Object.values(newStats.stats).find(Array.isArray)?.length ?? 0) - 1),
          newStats.endTimestamp,
        ]

        stats.value.get(mapKey)!.stats = newStats.stats
        stats.value.get(mapKey)!.canBeExpired = newStats.canBeExpired
        await promiseTimeout(newStats.interval * 1000)
      },
      0,
      { immediate: true }
    )

    stats.value.set(mapKey, {
      canBeExpired: false,
      id: object.uuid,
      name: object.name_label,
      stats: undefined,
      pausable,
    })
  }

  const unregister = (object: T) => {
    const mapKey = `${object.uuid}-${granularity}`
    stats.value.get(mapKey)?.pausable.pause()
    stats.value.delete(mapKey)
  }

  onUnmounted(() => {
    abortController.abort()
    stats.value.forEach(stat => stat.pausable.pause())
  })

  return {
    register,
    unregister,
    stats: computed(() => Array.from(stats.value.values()) as Stat<S>[]),
    timestampStart: computed(() => timestamp.value[0]),
    timestampEnd: computed(() => timestamp.value[1]),
  }
}
