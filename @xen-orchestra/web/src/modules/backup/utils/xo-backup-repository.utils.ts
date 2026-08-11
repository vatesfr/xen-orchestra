import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import type { IconName } from '@core/icons'

export type BackupRepositoryType = 'file' | 'nfs' | 'smb' | 's3' | 'azure' | 'azurite'

export type BackupRepositoryNfsInfo = {
  host: string
  port: string | undefined
  path: string
}

const NFS_RE = /^([^:]+):(?:(\d+):)?([^:?]+)(\?[^?]*)?$/

export function getBackupRepositoryType(url: string): BackupRepositoryType {
  const urlProtocol = url.split('://')[0]

  if (urlProtocol.startsWith('s3')) {
    return 's3'
  }

  if (urlProtocol.startsWith('azurite')) {
    return 'azurite'
  }

  return urlProtocol as BackupRepositoryType
}

function getUrlParams(url: string) {
  return new URLSearchParams(url.split('?')[1] ?? '')
}

export function isBackupRepositoryEncrypted(url: string): boolean {
  return getUrlParams(url).has('encryptionKey')
}

export function isBackupRepositoryBlockBased(url: string): boolean {
  return getUrlParams(url).get('useVhdDirectory') === 'true'
}

const withoutLeadingSlash = (path: string) => `${path.replace(/^\/+/, '')}`

export function getBackupRepositoryNfsInfo(url: string): BackupRepositoryNfsInfo {
  const rest = url.split('://')[1] ?? ''
  const matches = NFS_RE.exec(rest)

  if (matches === null) {
    const [host, path = ''] = rest.split(':')

    return { host, port: undefined, path: withoutLeadingSlash(path) }
  }

  const [, host, port, path] = matches

  return { host, port, path: withoutLeadingSlash(path) }
}

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
