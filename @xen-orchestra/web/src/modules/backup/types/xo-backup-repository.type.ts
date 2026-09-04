export const BACKUP_REPOSITORY_TYPE = {
  FILE: 'file',
  NFS: 'nfs',
  SMB: 'smb',
  S3: 's3',
  AZURE: 'azure',
  AZURITE: 'azurite',
} as const

export type BackupRepositoryType = (typeof BACKUP_REPOSITORY_TYPE)[keyof typeof BACKUP_REPOSITORY_TYPE]

export type BackupRepositoryProtocol = 'http' | 'https'

// Serialized options in the URL query string
export type BackupRepositoryUrlOptions = {
  allowUnauthorized?: boolean
  encryptionKey?: string
  useVhdDirectory?: boolean
}

export type ParsedFileBackupRepositoryUrl = BackupRepositoryUrlOptions & {
  type: 'file'
  path: string
}

// invalidUrl is set when the path could not be fully parsed and part of it was dropped.
// XO 5 uses it to offer rewriting the stored URL.
export type ParsedNfsBackupRepositoryUrl = BackupRepositoryUrlOptions & {
  type: 'nfs'
  host: string
  port: string | undefined
  path: string
  invalidUrl?: true
}

export type ParsedSmbBackupRepositoryUrl = BackupRepositoryUrlOptions & {
  type: 'smb'
  host: string
  path: string
  domain: string
  username: string
  password: string
}

export type ParsedS3BackupRepositoryUrl = BackupRepositoryUrlOptions & {
  type: 's3'
  protocol: BackupRepositoryProtocol
  host: string
  path: string
  region: string | undefined
  username: string
  password: string
}

export type ParsedAzureBackupRepositoryUrl = BackupRepositoryUrlOptions & {
  type: 'azure' | 'azurite'
  protocol: BackupRepositoryProtocol
  host: string
  port: string
  path: string
  username: string
  password: string
}

export type ParsedBackupRepositoryUrl =
  | ParsedFileBackupRepositoryUrl
  | ParsedNfsBackupRepositoryUrl
  | ParsedSmbBackupRepositoryUrl
  | ParsedS3BackupRepositoryUrl
  | ParsedAzureBackupRepositoryUrl

export type BackupRepositoryUrlInput = BackupRepositoryUrlOptions & {
  type: BackupRepositoryType | 'local'
  host?: string
  port?: string
  path?: string
  protocol?: BackupRepositoryProtocol
  region?: string
  domain?: string
  username?: string
  password?: string
}
