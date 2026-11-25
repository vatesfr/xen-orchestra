import type {
  ParsedAzureBackupRepositoryUrl,
  ParsedFileBackupRepositoryUrl,
  ParsedNfsBackupRepositoryUrl,
  ParsedS3BackupRepositoryUrl,
  ParsedSmbBackupRepositoryUrl,
} from 'xo-remote-parser'

/** A parsed NFS backup repository url, with a port. */
export function createNfsUrl(overrides: Partial<ParsedNfsBackupRepositoryUrl> = {}): ParsedNfsBackupRepositoryUrl {
  return { type: 'nfs', host: '192.168.100.225', port: '2049', path: '/media/nfs', ...overrides }
}

/** A parsed SMB backup repository url, with a sub-folder, a domain and credentials. */
export function createSmbUrl(overrides: Partial<ParsedSmbBackupRepositoryUrl> = {}): ParsedSmbBackupRepositoryUrl {
  return {
    type: 'smb',
    host: '192.168.100.10',
    path: 'share\\backups',
    domain: 'WORKGROUP',
    username: 'admin',
    password: 'p4ssw0rd',
    ...overrides,
  }
}

/** A parsed local (file) backup repository url. */
export function createFileUrl(overrides: Partial<ParsedFileBackupRepositoryUrl> = {}): ParsedFileBackupRepositoryUrl {
  return { type: 'file', path: '/var/lib/xo/backups', ...overrides }
}

/** A parsed S3 backup repository url over https, with a region and a path in its bucket. */
export function createS3Url(overrides: Partial<ParsedS3BackupRepositoryUrl> = {}): ParsedS3BackupRepositoryUrl {
  return {
    type: 's3',
    protocol: 'https',
    host: 's3.us-west-1.amazonaws.com',
    path: '/my-bucket/backups/xo',
    region: 'us-west-1',
    username: 'AKIAIOSFODNN7',
    password: 'wJalrXUtnFEMI',
    ...overrides,
  }
}

/** A parsed Azure Blob backup repository url over https, with a path in its container. */
export function createAzureUrl(
  overrides: Partial<ParsedAzureBackupRepositoryUrl> = {}
): ParsedAzureBackupRepositoryUrl {
  return {
    type: 'azure',
    protocol: 'https',
    host: 'myaccount.blob.core.windows.net',
    port: '443',
    path: '/my-container/backups/xo',
    username: 'myaccount',
    password: 'azure-account-key',
    ...overrides,
  }
}

/** Same as {@link createAzureUrl}, for a local Azurite emulator. */
export function createAzuriteUrl(
  overrides: Partial<ParsedAzureBackupRepositoryUrl> = {}
): ParsedAzureBackupRepositoryUrl {
  return createAzureUrl({
    type: 'azurite',
    host: '127.0.0.1',
    port: '10000',
    username: 'devstoreaccount1',
    password: 'azurite-account-key',
    ...overrides,
  })
}
