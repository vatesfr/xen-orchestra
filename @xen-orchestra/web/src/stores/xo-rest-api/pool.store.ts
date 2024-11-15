import type { XoPif } from '@/types/xo/pif.type'
import type { XoPool } from '@/types/xo/pool.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePoolStore = defineStore('pool', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('pool')

  const pool = computed<XoPool | undefined>(() => baseContext.records.value[0])
  const isMasterHost = (hostRef: XoPif['$host']) => pool.value?.master === hostRef

  const context = {
    ...baseContext,
    pool,
    isMasterHost,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
