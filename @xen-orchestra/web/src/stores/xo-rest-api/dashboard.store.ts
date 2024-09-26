import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { formatSizeRaw } from '@/utils/size.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useDashboardStore = defineStore('dashboard', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('dashboard', { pollInterval: 5000 })

  const backupRepositories = computed(() => {
    return {
      available: formatSizeRaw(baseContext.record.value?.backupRepositories?.other.size.available, 1),
      backups: formatSizeRaw(baseContext.record.value?.backupRepositories?.other.size.backups, 1),
      other: formatSizeRaw(baseContext.record.value?.backupRepositories?.other.size.other, 1),
      total: formatSizeRaw(baseContext.record.value?.backupRepositories?.other.size.total, 1),
      used: formatSizeRaw(baseContext.record.value?.backupRepositories?.other.size.used, 1),
    }
  })

  const storageRepositories = computed(() => {
    return {
      total: formatSizeRaw(baseContext.record.value?.storageRepositories.size.total, 1),
      used: formatSizeRaw(baseContext.record.value?.storageRepositories.size.used, 1),
      available: formatSizeRaw(baseContext.record.value?.storageRepositories.size.available, 1),
    }
  })

  const backupIssues = computed(() => baseContext.record.value?.backups?.issues ?? [])

  const context = {
    ...baseContext,
    backupRepositories,
    storageRepositories,
    backupIssues,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
