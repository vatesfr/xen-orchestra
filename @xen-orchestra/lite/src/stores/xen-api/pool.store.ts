import type { XenApiHost, XenApiPool } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePoolStore = defineStore('xen-api-pool', () => {
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pool')

  const pool = computed<XenApiPool | undefined>(() => baseContext.records.value[0])

  const isMasterHost = (hostRef: XenApiHost['$ref']) => pool.value?.master === hostRef

  const context = {
    ...baseContext,
    pool,
    isMasterHost,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
