import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { defineStore } from 'pinia'

export const useVmTemplateStore = defineStore('vm-template', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('vm_template', {
    sortBy: sortByNameLabel,
  })

  const context = {
    ...baseContext,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
