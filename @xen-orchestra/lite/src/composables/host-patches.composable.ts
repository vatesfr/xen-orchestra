import { fetchMissingHostPatches } from '@/libs/host'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import type { XenApiPatch } from '@/types/xen-api'
import { type Pausable, useTimeoutPoll, watchArray } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, reactive, toValue } from 'vue'

export type XenApiPatchWithHostRefs = XenApiPatch & { $hostRefs: Set<string> }

type HostConfig = {
  timeoutPoll: Pausable
  patches: XenApiPatch[]
  isLoaded: boolean
}

export const useHostPatches = (hosts: MaybeRefOrGetter<XenApiHost[]>) => {
  const configByHost = reactive(new Map()) as Map<string, HostConfig>

  const fetchHostPatches = async (hostRef: XenApiHost['$ref']) => {
    if (!configByHost.has(hostRef)) {
      return
    }

    const config = configByHost.get(hostRef)!

    config.patches = await fetchMissingHostPatches(hostRef)
    config.isLoaded = true
  }

  const registerHost = (hostRef: XenApiHost['$ref']) => {
    if (configByHost.has(hostRef)) {
      return
    }

    const timeoutPoll = useTimeoutPoll(() => fetchHostPatches(hostRef), 10000, {
      immediate: true,
    })

    configByHost.set(hostRef, {
      timeoutPoll,
      patches: [],
      isLoaded: false,
    })
  }

  const unregisterHost = (hostRef: string) => {
    configByHost.get(hostRef)?.timeoutPoll.pause()
    configByHost.delete(hostRef)
  }

  watchArray(
    () => toValue(hosts).map(host => host.$ref),
    (_n, _p, addedRefs, removedRefs) => {
      addedRefs.forEach(ref => registerHost(ref))
      removedRefs?.forEach(ref => unregisterHost(ref))
    },
    { immediate: true }
  )

  const patches = computed(() => {
    const records = new Map<string, XenApiPatchWithHostRefs>()

    configByHost.forEach(({ patches }, hostRef) => {
      patches.forEach(patch => {
        const record = records.get(patch.$id)

        if (record !== undefined) {
          return record.$hostRefs.add(hostRef)
        }

        records.set(patch.$id, {
          ...patch,
          $hostRefs: new Set([hostRef]),
        })
      })
    })

    return Array.from(records.values())
  })

  const count = computed(() => patches.value.length)

  const areAllLoaded = computed(() => Array.from(configByHost.values()).every(config => config.isLoaded))

  const areSomeLoaded = computed(
    () => areAllLoaded.value || Array.from(configByHost.values()).some(config => config.isLoaded)
  )

  return { patches, count, areAllLoaded, areSomeLoaded }
}
