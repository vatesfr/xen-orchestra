import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { formatSizeRaw } from '@/utils/size.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useDashboardStore = defineStore('dashboard', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('dashboard')

  const backupRepositories = computed(() => {
    return {
      total: formatSizeRaw(baseContext.record.value?.backupRepositories?.size.total, 1),
      used: formatSizeRaw(baseContext.record.value?.backupRepositories?.size.used, 1),
      available: formatSizeRaw(baseContext.record.value?.backupRepositories?.size.available, 1),
    }
  })

  const storageRepositories = computed(() => {
    return {
      total: formatSizeRaw(baseContext.record.value?.storageRepositories.size.total, 1),
      used: formatSizeRaw(baseContext.record.value?.storageRepositories.size.used, 1),
      available: formatSizeRaw(baseContext.record.value?.storageRepositories.size.available, 1),
    }
  })

  const backupIssues = computed(() => {
    if (baseContext.record.value?.backups === undefined) {
      return []
    }

    return baseContext.record.value.backups.issues.map(issue => {
      const states = issue.logs.map(log => (log === 'skipped' || log === 'interrupted' ? 'partial' : log))

      return {
        id: issue.uuid,
        label: issue.name,
        states,
        type: issue.type,
      }
    })
  })

  const context = {
    ...baseContext,
    backupRepositories,
    storageRepositories,
    backupIssues,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
