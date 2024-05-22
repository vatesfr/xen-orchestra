import type { XenApiPool } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePoolStore = defineStore('xen-api-pool', () => {
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pool')

  const pool = computed<XenApiPool | undefined>(() => baseContext.records.value[0])

  const context = {
    ...baseContext,
    pool,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
