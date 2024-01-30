import { useSubscriber } from '@/composables/subscriber.composable'
import { useXenApiStoreBaseContext } from '@/composables/xen-api-store-base-context.composable'
import { messagesToAlarms, messageToAlarm } from '@/libs/alarm'
import type { XenApiMessage } from '@/libs/xen-api/xen-api.types'
import { useXenApiStore } from '@/stores/xen-api.store'
import { createUseCollection } from '@/stores/xen-api/create-use-collection'
import { useMessageStore } from '@/stores/xen-api/message.store'
import type { XenApiAlarm } from '@/types/xen-api'
import { defineStore } from 'pinia'

export const useAlarmStore = defineStore('xen-api-alarm', () => {
  const context = useXenApiStoreBaseContext<XenApiAlarm<any>>()
  const xenApiStore = useXenApiStore()
  const xenApi = xenApiStore.getXapi()
  const messageStore = useMessageStore()

  const onBeforeLoad = () => (context.isFetching.value = true)

  const onAfterLoad = (records: XenApiMessage<any>[]) => {
    const alarms = messagesToAlarms(records)
    alarms.forEach(alarm => context.add(alarm))
    context.isFetching.value = false
    context.isReady.value = true
  }

  const onAdd = (record: XenApiMessage<any>) => {
    const alarm = messageToAlarm(record)

    if (alarm !== undefined) {
      context.add(alarm)
    }
  }

  const onRemove = (opaqueRef: XenApiMessage<any>['$ref']) => {
    context.remove(opaqueRef)
  }

  const subscriptionId = Symbol('SUBSCRIPTION_ID')

  const subscriber = useSubscriber({
    enabled: () => xenApiStore.isConnected,
    onSubscriptionStart: () => {
      xenApi.addEventListener('message.beforeLoad', onBeforeLoad)
      xenApi.addEventListener('message.afterLoad', onAfterLoad)
      xenApi.addEventListener('message.add', onAdd)
      xenApi.addEventListener('message.mod', onAdd)
      xenApi.addEventListener('message.del', onRemove)
      messageStore.subscribe(subscriptionId)
    },
    onSubscriptionEnd: () => {
      xenApi.removeEventListener('message.beforeLoad', onBeforeLoad)
      xenApi.removeEventListener('message.afterLoad', onAfterLoad)
      xenApi.removeEventListener('message.add', onAdd)
      xenApi.removeEventListener('message.mod', onAdd)
      xenApi.removeEventListener('message.del', onRemove)
      messageStore.unsubscribe(subscriptionId)
    },
  })

  return {
    ...context,
    ...subscriber,
  }
})

export const useAlarmCollection = createUseCollection(useAlarmStore)
