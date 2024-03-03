import { useSubscriber } from '@/composables/subscriber.composable'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineStore } from 'pinia'

export const useMessageStore = defineStore('xen-api-message', () => {
  const xenApiStore = useXenApiStore()

  return useSubscriber({
    enabled: () => xenApiStore.isConnected,
    onSubscriptionStart: () => {
      void xenApiStore.getXapi().loadRecords('message')
    },
  })
})
