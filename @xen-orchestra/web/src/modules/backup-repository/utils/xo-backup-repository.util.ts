import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import type { IconName } from '@core/icons'
import { BACKUP_REPOSITORY_COMPRESSION } from '@vates/types'
import type { BackupRepositoryType, BackupRepositoryUrlOptions } from 'xo-remote-parser'

export const BACKUP_REPOSITORY_COMPRESSIONS = Object.values(BACKUP_REPOSITORY_COMPRESSION)

// a backup repository in block mode without compressionType in its URL uses brotli
export const DEFAULT_BACKUP_REPOSITORY_COMPRESSION: BACKUP_REPOSITORY_COMPRESSION = BACKUP_REPOSITORY_COMPRESSION.BROTLI

// can be any string: the URL may have been written by hand
export function getBackupRepositoryCompression(urlOptions: BackupRepositoryUrlOptions): string {
  return urlOptions.compressionType ?? DEFAULT_BACKUP_REPOSITORY_COMPRESSION
}

export function isBackupRepositoryCompression(compression: string): compression is BACKUP_REPOSITORY_COMPRESSION {
  return (BACKUP_REPOSITORY_COMPRESSIONS as string[]).includes(compression)
}

export const MASKED_SECRET = '•'.repeat(12)

export function maskSecret(secret: string | undefined): string {
  return secret !== undefined && secret !== '' ? MASKED_SECRET : ''
}

export function getBackupRepositoryStatus(br: FrontXoBackupRepository): Status {
  if (!br.enabled) {
    return 'disabled'
  }

  return br.error ? 'unable-to-connect' : 'enabled'
}

export function getBackupRepositoryIcon(br: FrontXoBackupRepository, type: BackupRepositoryType | undefined): IconName {
  if (type === undefined) {
    return 'object:br:unknown'
  }

  if (!br.enabled) {
    return 'object:br:disabled'
  }

  return br.error ? 'object:br:disconnected' : 'object:br:connected'
}

export function formatMountOptions(options: string | undefined): string {
  return (options ?? '')
    .split(',')
    .map(option => option.trim())
    .filter(Boolean)
    .join(', ')
}

export function splitBackupRepositoryPath(path: string): { root: string; subPath: string } {
  const parts = path.replace(/^\/+/, '').split('/')

  return {
    root: parts[0] ?? '',
    subPath: `/${parts.slice(1).join('/')}`,
  }
}
