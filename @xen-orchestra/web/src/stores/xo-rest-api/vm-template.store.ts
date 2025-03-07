import type { XoPool } from '@/types/xo/pool.type'
import type { XoVmTemplate } from '@/types/xo/vm-template.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useVmTemplateStore = defineStore('vm-template', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('vm_template', {
    sortBy: sortByNameLabel,
  })

  const vmsTemplatesByPool = computed(() => {
    const vmTemplatesByPoolMap = new Map<XoPool['id'], XoVmTemplate[]>()
    baseContext.records.value.forEach(template => {
      const poolId = template.$pool
      if (!vmTemplatesByPoolMap.has(poolId)) {
        vmTemplatesByPoolMap.set(poolId, [])
      }
      vmTemplatesByPoolMap.get(poolId)?.push(template)
    })

    return vmTemplatesByPoolMap
  })

  const context = {
    ...baseContext,
    vmsTemplatesByPool,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
