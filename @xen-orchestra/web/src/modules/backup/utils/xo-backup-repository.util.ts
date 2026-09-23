import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import type { IconName } from '@core/icons'

export const MASKED_SECRET = '•'.repeat(12)

export function getBackupRepositoryStatus(br: FrontXoBackupRepository): Status {
  if (!br.enabled) {
    return 'disabled'
  }

  return br.error ? 'unable-to-connect' : 'enabled'
}

export function getBackupRepositoryIcon(br: FrontXoBackupRepository, type: string | undefined): IconName {
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
