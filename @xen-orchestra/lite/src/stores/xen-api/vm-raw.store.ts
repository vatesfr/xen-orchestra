import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { defineStore } from 'pinia'

export const useVmRawStore = defineStore('xen-api-vm-raw', () => {
  const config = createXapiStoreConfig('vm', {
    sortBy: (vm1, vm2) => sortByNameLabel(vm1, vm2),
  })

  return createSubscribableStoreContext(config, {})
})
