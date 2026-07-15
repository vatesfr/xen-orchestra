import type { XenApiVdi } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useVdiStore = defineStore('xen-api-vdi', () => {
  let getVdiByOpaqueRef: ((ref: XenApiVdi['$ref']) => XenApiVdi | undefined) | null = null

  const calculateVdiChainPhysicalUsage = (vdi: XenApiVdi): number => {
    let chainTotalUsage = +(vdi.physical_utilisation ?? 0)

    let parentUuid = vdi.sm_config?.['vhd-parent'] as XenApiVdi['$ref'] | undefined

    while (parentUuid !== undefined) {
      const parentVdi = getVdiByOpaqueRef?.(parentUuid)

      if (parentVdi === undefined) {
        break
      }

      chainTotalUsage += +(parentVdi.physical_utilisation ?? 0)

      parentUuid = parentVdi.sm_config?.['vhd-parent'] as XenApiVdi['$ref'] | undefined
    }

    return chainTotalUsage
  }

  const enrichVdiWithChainUsage = (vdi: XenApiVdi): XenApiVdi & { chainPhysicalUsage: number } => {
    return {
      ...vdi,
      chainPhysicalUsage: calculateVdiChainPhysicalUsage(vdi),
    }
  }

  const config = createXapiStoreConfig('vdi', {
    beforeAdd: (vdi: XenApiVdi) => enrichVdiWithChainUsage(vdi),
  })

  const context = createSubscribableStoreContext(config, {})

  getVdiByOpaqueRef = context.getContext().getByOpaqueRef

  return context
})
