import type { XenApiPif } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const usePifMetricsStore = defineStore('xen-api-pif-metrics', () => {
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pif_metrics')

  const getPifCarrier = (pif: XenApiPif) => {
    const pifMetrics = baseContext.getByOpaqueRef(pif.metrics)
    return pifMetrics.carrier
  }

  const context = {
    ...baseContext,
    getPifCarrier,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
