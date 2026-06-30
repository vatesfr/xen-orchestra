import type { XenApiHost, XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const usePbdStore = defineStore('xen-api-pbd', () => {
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pbd')

  const getPbdsForHost = (hostRef: XenApiHost['$ref']) => baseContext.records.value.filter(pbd => pbd.host === hostRef)

  const getPbdsForSr = (srRef: XenApiSr['$ref']) => baseContext.records.value.filter(pbd => pbd.SR === srRef)

  const context = {
    ...baseContext,
    getPbdsForHost,
    getPbdsForSr,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
