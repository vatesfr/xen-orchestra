import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { V2vDestinationDefaults, V2vMigrationListKey } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import {
  buildV2vMigrationList,
  getV2vMigrationListStorageKey,
  parseV2vMigrationList,
} from '@/modules/v2v/utils/v2v-migration-list.util.ts'
import { useLocalStorage } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

// Never read: a storage key is needed while the source or the pool is still unknown
const NO_LIST_STORAGE_KEY = 'v2v:migration-list'

// One list per (source, pool) in this browser: nothing is stored server-side before the launch
export function useV2vMigrationList(
  rawSourceId: MaybeRefOrGetter<string | undefined>,
  rawPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>
) {
  const listKey = computed((): V2vMigrationListKey | undefined => {
    const sourceId = toValue(rawSourceId)
    const poolId = toValue(rawPoolId)

    const isKnown = sourceId !== undefined && poolId !== undefined

    return isKnown ? { sourceId, poolId } : undefined
  })

  const storageKey = computed(() =>
    listKey.value === undefined ? NO_LIST_STORAGE_KEY : getV2vMigrationListStorageKey(listKey.value)
  )

  // Synchronous: a pool change must expose its list before the destination form prefills from it
  const rawList = useLocalStorage<string | null>(storageKey, null, {
    flush: 'sync',
    serializer: { read: raw => raw, write: raw => raw ?? '' },
    onError: error => console.error('Failed to access the V2V migration list', error),
  })

  const list = computed(() => {
    const key = listKey.value
    const raw = rawList.value

    const hasStoredList = key !== undefined && raw !== null

    if (!hasStoredList) {
      return undefined
    }

    try {
      return parseV2vMigrationList(JSON.parse(raw), key)
    } catch {
      return undefined
    }
  })

  function saveDefaults(defaults: V2vDestinationDefaults) {
    const key = listKey.value

    if (key === undefined) {
      return
    }

    const vms = list.value?.vms ?? []

    rawList.value = JSON.stringify(buildV2vMigrationList(key, defaults, vms))
  }

  return { list, saveDefaults }
}
