import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useVtpmStore = defineStore('xen-api-vtpm', () => {
  const config = createXapiStoreConfig('vtpm')

  return createSubscribableStoreContext(config, {})
})
