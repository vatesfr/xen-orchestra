import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const usePifMetricsStore = defineStore('xen-api-pif-metrics', () => {
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pif_metrics')

  const getPifCarrier = (pif: XenApiPif) => baseContext.getByOpaqueRef(pif.metrics)?.carrier

  const context = {
    ...baseContext,
    getPifCarrier,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
