import { type SubscriberDependencies, useSubscriber } from '@/composables/subscriber.composable'
import type { XenApiStoreBaseContext } from '@/composables/xen-api-store-base-context.composable'
import type { ObjectType, ObjectTypeToRecord } from '@/libs/xen-api/xen-api.types'
import { useXenApiStore } from '@/stores/xen-api.store'
import { useI18n } from 'vue-i18n'

export const useXenApiStoreSubscriber = <Type extends ObjectType, XRecord extends ObjectTypeToRecord<Type>>(
  type: Type,
  context: XenApiStoreBaseContext<XRecord>,
  dependencies?: SubscriberDependencies
) => {
  const xenApiStore = useXenApiStore()
  const xenApi = xenApiStore.getXapi()
  const i18n = useI18n()

  const onBeforeLoad = () => (context.isFetching.value = true)

  const onAfterLoad = (records: XRecord[]) => {
    records.forEach(record => context.add(record))
    context.isFetching.value = false
    context.isReady.value = true
  }

  const onLoadError = (error: Error) => {
    context.isFetching.value = false
    context.isReady.value = false
    context.lastError.value = i18n.t('error-no-data')
    console.error(error)
  }

  const onAdd = (record: XRecord) => {
    context.add(record)
  }

  const onRemove = (opaqueRef: XRecord['$ref']) => {
    context.remove(opaqueRef)
  }

  return useSubscriber({
    enabled: () => xenApiStore.isConnected,
    onSubscriptionStart: () => {
      xenApi.addEventListener<Type>(`${type}.beforeLoad`, onBeforeLoad)
      xenApi.addEventListener<Type, XRecord>(`${type}.afterLoad`, onAfterLoad)
      xenApi.addEventListener<Type>(`${type}.loadError`, onLoadError)
      xenApi.addEventListener<Type, XRecord>(`${type}.add`, onAdd)
      xenApi.addEventListener<Type, XRecord>(`${type}.mod`, onAdd)
      xenApi.addEventListener<Type, XRecord>(`${type}.del`, onRemove)

      void xenApi.loadRecords<Type, XRecord>(type)
    },
    onSubscriptionEnd: async () => {
      context.isReady.value = false

      xenApi.removeEventListener<Type>(`${type}.beforeLoad`, onBeforeLoad)
      xenApi.removeEventListener<Type, XRecord>(`${type}.afterLoad`, onAfterLoad)
      xenApi.removeEventListener<Type>(`${type}.loadError`, onLoadError)
      xenApi.removeEventListener<Type, XRecord>(`${type}.add`, onAdd)
      xenApi.removeEventListener<Type, XRecord>(`${type}.mod`, onAdd)
      xenApi.removeEventListener<Type, XRecord>(`${type}.del`, onRemove)
    },
    dependencies,
  })
}
