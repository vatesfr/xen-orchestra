import type { XenApiPif } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import type { Status } from '@/types/status'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const usePifStore = defineStore('xen-api-pif', () => {
  const { context: baseContext, ...configRest } = createXapiStoreConfig('pif')

  const determineStatus = (PIFs: XenApiPif[]): Status => {
    if (PIFs.length === 0) {
      return 'disconnected'
    }
    const currentlyAttached = PIFs.map(PIF => PIF.currently_attached)
    if (currentlyAttached.every(Boolean)) {
      return 'connected'
    }
    if (currentlyAttached.some(Boolean)) {
      return 'partially-connected'
    }
    return 'disconnected'
  }

  const context = { ...baseContext, determineStatus }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
