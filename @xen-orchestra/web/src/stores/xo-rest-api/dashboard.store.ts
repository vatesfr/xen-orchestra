import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { formatSizeRaw } from '@/utils/size.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useDashboardStore = defineStore('dashboard', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('dashboard')

  const backupRepositories = computed(() => {
    return {
      total: formatSizeRaw(baseContext.record.value.backupRepositories?.size.total, 1),
      used: formatSizeRaw(baseContext.record.value.backupRepositories?.size.used, 1),
      available: formatSizeRaw(baseContext.record.value.backupRepositories?.size.available, 1),
    }
  })

  const storageRepositories = computed(() => {
    return {
      total: formatSizeRaw(baseContext.record.value.storageRepositories.size.total, 1),
      used: formatSizeRaw(baseContext.record.value.storageRepositories.size.used, 1),
      available: formatSizeRaw(baseContext.record.value.storageRepositories.size.available, 1),
    }
  })

  const context = {
    ...baseContext,
    backupRepositories,
    storageRepositories,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
