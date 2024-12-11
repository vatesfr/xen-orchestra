import { SERVER_STATUS } from '@/types/xo/server.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useServerStore = defineStore('server', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('server')

  const records = computed(() =>
    // Filter out disconnected servers when there is a connected server in the same pool
    baseContext.records.value.filter(
      server => server.status !== SERVER_STATUS.DISCONNECTED || !server.error?.connectedServerId
    )
  )

  const context = {
    ...baseContext,
    records,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
