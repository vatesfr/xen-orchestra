import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  V2vDestinationDefaults,
  V2vMigrationListKey,
  V2vMigrationListVm,
} from '@/modules/v2v/types/v2v-migration-list.type.ts'
import {
  buildV2vMigrationList,
  getV2vMigrationListStorageKey,
  parseV2vMigrationList,
} from '@/modules/v2v/utils/v2v-migration-list.util.ts'
import type { XoV2vVm } from '@vates/types'
import { useLocalStorage } from '@vueuse/core'
import { difference, isEqual, uniq } from 'lodash-es'
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

  const vmCount = computed(() => list.value?.vms.length ?? 0)

  const hasVms = computed(() => vmCount.value > 0)

  function write(key: V2vMigrationListKey, defaults: V2vDestinationDefaults, vms: V2vMigrationListVm[]) {
    rawList.value = JSON.stringify(buildV2vMigrationList(key, defaults, vms))
  }

  function saveDefaults(defaults: V2vDestinationDefaults) {
    const key = listKey.value

    if (key === undefined) {
      return
    }

    write(key, defaults, list.value?.vms ?? [])
  }

  // No stored list means no destination defaults yet: the VMs cannot invent them
  function updateVms(getNextVms: (vms: V2vMigrationListVm[]) => V2vMigrationListVm[]) {
    const currentList = list.value

    if (currentList === undefined) {
      return
    }

    const nextVms = getNextVms(currentList.vms)

    const isUnchanged = isEqual(nextVms, currentList.vms)

    if (isUnchanged) {
      return
    }

    const { sourceId, poolId, defaults } = currentList

    write({ sourceId, poolId }, defaults, nextVms)
  }

  function addVms(ids: XoV2vVm['id'][]) {
    updateVms(vms => {
      const listedIds = vms.map(vm => vm.id)
      const newIds = difference(uniq(ids), listedIds)

      return [...vms, ...newIds.map(id => ({ id }))]
    })
  }

  function removeVm(id: XoV2vVm['id']) {
    updateVms(vms => vms.filter(vm => vm.id !== id))
  }

  function clearVms() {
    updateVms(() => [])
  }

  return { list, vmCount, hasVms, saveDefaults, addVms, removeVm, clearVms }
}
