import { createXoStoreConfig } from '@/utils/create-xo-store-config.util.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const useVmControllerStore = defineStore('vm-controller', () => {
  const config = createXoStoreConfig('vm_controller')

  return createSubscribableStoreContext(config, {})
})
