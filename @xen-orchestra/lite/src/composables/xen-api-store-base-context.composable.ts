import type { XenApiRecord } from '@/libs/xen-api/xen-api.types'
import { computed, ref, shallowReactive } from 'vue'

export const useXenApiStoreBaseContext = <XRecord extends XenApiRecord<any>>() => {
  const recordsByOpaqueRef = shallowReactive(new Map<string, XRecord>())
  const recordsByUuid = shallowReactive(new Map<string, XRecord>())
  const records = computed(() => Array.from(recordsByOpaqueRef.values()))
  const isReady = ref(false)
  const isFetching = ref(false)
  const isLoading = computed(() => !isReady.value && isFetching.value)
  const isReloading = computed(() => isReady.value && isFetching.value)
  const lastError = ref<string>()
  const hasError = computed(() => lastError.value !== undefined)

  const getByOpaqueRef = (opaqueRef: XRecord['$ref']) => {
    return recordsByOpaqueRef.get(opaqueRef)
  }

  const getByOpaqueRefs = (opaqueRefs: XRecord['$ref'][]) => {
    return opaqueRefs.map(getByOpaqueRef).filter(record => record !== undefined) as XRecord[]
  }

  const getByUuid = (uuid: XRecord['uuid']) => {
    return recordsByUuid.get(uuid)
  }

  const hasUuid = (uuid: XRecord['uuid']) => {
    return recordsByUuid.has(uuid)
  }

  const add = (record: XRecord) => {
    recordsByOpaqueRef.set(record.$ref, record)
    recordsByUuid.set(record.uuid, record)
  }

  const remove = (opaqueRef: XRecord['$ref']) => {
    const record = getByOpaqueRef(opaqueRef)

    if (record !== undefined) {
      recordsByOpaqueRef.delete(opaqueRef)
      recordsByUuid.delete(record.uuid)
    }
  }

  return {
    isFetching,
    isReady,
    isLoading,
    isReloading,
    hasError,
    lastError,
    records,
    getByOpaqueRef,
    getByOpaqueRefs,
    getByUuid,
    hasUuid,
    add,
    remove,
  }
}

export type XenApiStoreBaseContext<XRecord extends XenApiRecord<any>> = ReturnType<
  typeof useXenApiStoreBaseContext<XRecord>
>
