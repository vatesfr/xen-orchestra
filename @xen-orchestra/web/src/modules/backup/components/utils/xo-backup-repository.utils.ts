export type BackupRepositoryType = 'file' | 'nfs' | 'smb' | 's3' | 'azure' | 'azurite'

export type BackupRepositoryUrlInfo = {
  type: BackupRepositoryType
  host: string | undefined
  port: string | undefined
  path: string | undefined
  isEncrypted: boolean
  isBlockBased: boolean
  isInvalid: boolean
}

const NFS_RE = /^([^:]+):(?:(\d+):)?([^:?]+)(\?[^?]*)?$/
const SMB_RE = /^([^:]+):(.+)@([^@]+)\\\\([^\0?]+)(?:\0([^?]*))?(\?[^?]*)?$/

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
