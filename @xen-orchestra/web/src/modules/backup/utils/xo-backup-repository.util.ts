import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import type { IconName } from '@core/icons'

export function getBackupRepositoryStatus(br: FrontXoBackupRepository): Status {
  if (!br.enabled) {
    return 'disabled'
  }

  return br.error ? 'unable-to-connect' : 'enabled'
}

export function getBackupRepositoryIcon(br: FrontXoBackupRepository): IconName {
  if (!br.enabled) {
    return 'object:br:disabled'
  }

  return br.error ? 'object:br:disconnected' : 'object:br:connected'
}
