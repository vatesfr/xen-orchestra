import type { XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const useVdiStore = defineStore('xen-api-vdi', () => {
  const { context: baseContext, ...configRest } = createXapiStoreConfig('vdi')

  const getChainPhysicalUsage = (vdi: XenApiVdi) => {
    if (vdi.is_a_snapshot || !vdi.managed) {
      return vdi.physical_utilisation
    }

    let total = vdi.physical_utilisation
    let parentUuid = vdi.sm_config['vhd-parent'] as XenApiVdi['uuid'] | undefined

    while (parentUuid !== undefined) {
      const parent = baseContext.getByUuid(parentUuid)

      if (parent === undefined) {
        break
      }

      total += parent.physical_utilisation
      parentUuid = parent.sm_config['vhd-parent'] as XenApiVdi['uuid'] | undefined
    }

    return total
  }

  const context = {
    ...baseContext,
    getChainPhysicalUsage,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
