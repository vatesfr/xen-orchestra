import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import type { IconName } from '@core/icons'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

export const MASKED_SECRET = '•'.repeat(12)

export function getBackupRepositoryStatus(br: FrontXoBackupRepository): Status {
  if (!br.enabled) {
    return 'disabled'
  }

  return br.error ? 'unable-to-connect' : 'enabled'
}

export function getBackupRepositoryIcon(br: FrontXoBackupRepository): IconName {
  if (parseBackupRepositoryUrl(br.url).type === undefined) {
    return 'object:br:unknown'
  }

  if (!br.enabled) {
    return 'object:br:disabled'
  }

  return br.error ? 'object:br:disconnected' : 'object:br:connected'
}

const BACKUP_REPOSITORY_TYPE_LABEL_KEYS: Record<string, string> = {
  file: 'local',
  nfs: 'nfs',
  smb: 'smb',
  s3: 's3',
  azure: 'azure',
  azurite: 'azurite',
}

export function getBackupRepositoryTypeLabelKey(type: string | undefined): string {
  return BACKUP_REPOSITORY_TYPE_LABEL_KEYS[type ?? ''] ?? 'unknown'
}

export function formatMountOptions(options: string | undefined): string {
  return (options ?? '')
    .split(',')
    .map(option => option.trim())
    .filter(Boolean)
    .join(', ')
}
