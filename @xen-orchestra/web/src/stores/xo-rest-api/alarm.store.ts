import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useAlarmStore = defineStore('alarm', () => {
  const config = createXoStoreConfig('alarm')

  return createSubscribableStoreContext(config, {})
})
