import type { ObjectType, ObjectTypeToRecord, XenApiRecord } from '@/libs/xen-api/xen-api.types'
import { useXenApiStore } from '@/stores/xen-api.store'
import type { SubscribableStoreConfig } from '@core/types/subscribable-store.type'
import { computed, type ComputedRef, readonly, type Ref, ref, shallowReactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type XapiContext<TRecord extends XenApiRecord<any>> = {
  records: ComputedRef<TRecord[]>
  getByOpaqueRef: (opaqueRef: TRecord['$ref']) => TRecord | undefined
  getByOpaqueRefs: (opaqueRefs: TRecord['$ref'][]) => TRecord[]
  getByUuid: (uuid: TRecord['uuid']) => TRecord | undefined
  hasUuid: (uuid: TRecord['uuid']) => boolean
  isFetching: Readonly<Ref<boolean>>
  isReady: Readonly<Ref<boolean>>
  lastError: Readonly<Ref<string | undefined>>
  hasError: ComputedRef<boolean>
}

export function createXapiStoreConfig<
  TType extends ObjectType,
  TRecordInput extends ObjectTypeToRecord<TType>,
  TBeforeAdd extends (input: TRecordInput) => undefined | XenApiRecord<any> = (input: TRecordInput) => TRecordInput,
  TRecord extends XenApiRecord<any> = TBeforeAdd extends (input: TRecordInput) => any
    ? NonNullable<ReturnType<TBeforeAdd>>
    : TRecordInput,
>(
  type: TType,
  options?: {
    sortBy?: (a: TRecord, b: TRecord) => number
    beforeAdd?: TBeforeAdd
  }
): SubscribableStoreConfig<XapiContext<TRecord>> {
  const xenApiStore = useXenApiStore()
  const xenApi = xenApiStore.getXapi()
  const i18n = useI18n()

  const recordsByOpaqueRef = shallowReactive(new Map<string, TRecord>())
  const recordsByUuid = shallowReactive(new Map<string, TRecord>())
  const records = computed(() => {
    const results = Array.from(recordsByOpaqueRef.values())

    if (options?.sortBy) {
      return results.sort(options.sortBy)
    }

    return results
  })

  const getByOpaqueRef = (opaqueRef: TRecord['$ref']) => recordsByOpaqueRef.get(opaqueRef)
  const getByOpaqueRefs = (opaqueRefs: TRecord['$ref'][]) =>
    opaqueRefs.map(getByOpaqueRef).filter(record => record !== undefined) as TRecord[]
  const getByUuid = (uuid: TRecord['uuid']) => recordsByUuid.get(uuid)
  const hasUuid = (uuid: TRecord['uuid']) => recordsByUuid.has(uuid)
  const isFetching = ref(false)
  const isReady = ref(false)
  const lastError = ref<string>()
  const hasError = computed(() => lastError.value !== undefined)

  function handleAdd(record: TRecordInput) {
    const recordToAdd = options?.beforeAdd ? options.beforeAdd(record) : record

    if (recordToAdd === undefined) {
      return
    }

    recordsByOpaqueRef.set(record.$ref, recordToAdd as TRecord)
    recordsByUuid.set(record.uuid, recordToAdd as TRecord)
  }

  const handleRemove = (opaqueRef: TRecord['$ref']) => {
    const record = getByOpaqueRef(opaqueRef)

    if (record !== undefined) {
      recordsByOpaqueRef.delete(opaqueRef)
      recordsByUuid.delete(record.uuid)
    }
  }

  const handleBeforeLoad = () => (isFetching.value = true)

  const handleAfterLoad = (records: TRecordInput[]) => {
    records.forEach(record => handleAdd(record))
    isFetching.value = false
    isReady.value = true
  }

  const handleLoadError = (error: Error) => {
    isFetching.value = false
    isReady.value = false
    lastError.value = i18n.t('error-no-data')
    console.error(error)
  }

  const onSubscribe = () => {
    xenApi.addEventListener<TType>(`${type}.beforeLoad`, handleBeforeLoad)
    xenApi.addEventListener<TType, TRecordInput>(`${type}.afterLoad`, handleAfterLoad)
    xenApi.addEventListener<TType>(`${type}.loadError`, handleLoadError)
    xenApi.addEventListener<TType, TRecordInput>(`${type}.add`, handleAdd)
    xenApi.addEventListener<TType, TRecordInput>(`${type}.mod`, handleAdd)
    xenApi.addEventListener<TType, TRecordInput>(`${type}.del`, handleRemove)

    void xenApi.loadRecords<TType, TRecordInput>(type)
  }

  const onUnsubscribe = () => {
    isReady.value = false

    xenApi.removeEventListener<TType>(`${type}.beforeLoad`, handleBeforeLoad)
    xenApi.removeEventListener<TType, TRecordInput>(`${type}.afterLoad`, handleAfterLoad)
    xenApi.removeEventListener<TType>(`${type}.loadError`, handleLoadError)
    xenApi.removeEventListener<TType, TRecordInput>(`${type}.add`, handleAdd)
    xenApi.removeEventListener<TType, TRecordInput>(`${type}.mod`, handleAdd)
    xenApi.removeEventListener<TType, TRecordInput>(`${type}.del`, handleRemove)
  }

  const context = {
    records,
    getByOpaqueRef,
    getByOpaqueRefs,
    getByUuid,
    hasUuid,
    isFetching: readonly(isFetching),
    isReady: readonly(isReady),
    lastError: readonly(lastError),
    hasError,
  } as XapiContext<TRecord>

  return { context, onSubscribe, onUnsubscribe, isEnabled: () => xenApiStore.isConnected }
}
