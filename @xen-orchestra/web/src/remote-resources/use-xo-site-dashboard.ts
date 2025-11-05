import type { XoDashboard } from '@/types/xo/dashboard.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { Info, Scale } from 'human-format'
import { computed } from 'vue'

export const useXoSiteDashboard = defineRemoteResource({
  url: '/rest/v0/dashboard?ndjson=true',
  stream: true,
  initialData: () => ({}) as XoDashboard,
  state: (dashboard, context) => {
    const backupRepositories = computed<BackupRepositories | undefined>(() => {
      if (dashboard.value?.backupRepositories === undefined) {
        return
      }

      return {
        available: formatSizeRaw(dashboard.value.backupRepositories.other.size.available, 1),
        backups: formatSizeRaw(dashboard.value.backupRepositories.other.size.backups, 1),
        other: formatSizeRaw(dashboard.value.backupRepositories.other.size.other ?? 0, 1),
        total: formatSizeRaw(dashboard.value.backupRepositories.other.size.total, 1),
        used: formatSizeRaw(dashboard.value.backupRepositories.other.size.used ?? 0, 1),
      }
    })

    const storageRepositories = computed<StorageRepositories | undefined>(() => {
      if (dashboard.value?.storageRepositories === undefined) {
        return
      }

      return {
        total: formatSizeRaw(dashboard.value.storageRepositories.size.total, 1),
        used: formatSizeRaw(dashboard.value.storageRepositories.size.used, 1),
        available: formatSizeRaw(dashboard.value.storageRepositories.size.available, 1),
        replicated: formatSizeRaw(dashboard.value.storageRepositories.size.replicated, 1),
        other: formatSizeRaw(dashboard.value.storageRepositories.size.other, 1),
      }
    })

    return {
      dashboard,
      isDashboardReady: context.isReady,
      backupRepositories,
      storageRepositories,
      hasError: context.hasError,
    }
  },
})

export type BackupRepositories = {
  available: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
  backups: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
  other: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
  total: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
  used: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
}

export type StorageRepositories = {
  total: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
  used: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
  available: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
  replicated: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
  other: Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>>
}
