import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { formatSizeRaw } from '@core/utils/size.util'
import type { Info, Scale } from 'human-format'
import { defineStore } from 'pinia'
import { computed, type ComputedRef } from 'vue'

export const useDashboardStore = defineStore('dashboard', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('dashboard', { pollInterval: 5000 })

  const backupRepositories: ComputedRef<
    | undefined
    | {
        available: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
        backups: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
        other: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
        total: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
        used: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
      }
  > = computed(() => {
    if (baseContext.record.value?.backupRepositories === undefined) {
      return
    }

    return {
      available: formatSizeRaw(baseContext.record.value.backupRepositories.other.size.available, 1),
      backups: formatSizeRaw(baseContext.record.value.backupRepositories.other.size.backups, 1),
      other: formatSizeRaw(baseContext.record.value.backupRepositories.other.size.other, 1),
      total: formatSizeRaw(baseContext.record.value.backupRepositories.other.size.total, 1),
      used: formatSizeRaw(baseContext.record.value.backupRepositories.other.size.used, 1),
    }
  })

  const storageRepositories: ComputedRef<
    | undefined
    | {
        total: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
        used: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
        available: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
        replicated: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
        other: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
      }
  > = computed(() => {
    if (baseContext.record.value?.storageRepositories === undefined) {
      return
    }

    return {
      total: formatSizeRaw(baseContext.record.value.storageRepositories.size.total, 1),
      used: formatSizeRaw(baseContext.record.value.storageRepositories.size.used, 1),
      available: formatSizeRaw(baseContext.record.value.storageRepositories.size.available, 1),
      replicated: formatSizeRaw(baseContext.record.value.storageRepositories.size.replicated, 1),
      other: formatSizeRaw(baseContext.record.value.storageRepositories.size.other, 1),
    }
  })

  const context = {
    ...baseContext,
    backupRepositories,
    storageRepositories,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
