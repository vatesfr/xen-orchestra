import type { AzureBackupRepositoryDetailsFormData } from '@/modules/backup-repository/form/details/use-azure-backup-repository-details-form.ts'
import type { LocalBackupRepositoryDetailsFormData } from '@/modules/backup-repository/form/details/use-local-backup-repository-details-form.ts'
import type { NfsBackupRepositoryDetailsFormData } from '@/modules/backup-repository/form/details/use-nfs-backup-repository-details-form.ts'
import type { S3BackupRepositoryDetailsFormData } from '@/modules/backup-repository/form/details/use-s3-backup-repository-details-form.ts'
import type { SmbBackupRepositoryDetailsFormData } from '@/modules/backup-repository/form/details/use-smb-backup-repository-details-form.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { BackupRepositoryDetailsPayload } from '@/modules/backup-repository/types/new-backup-repository.type.ts'
import { getBackupRepositoryDetailsInitialData } from '@/modules/backup-repository/utils/xo-backup-repository-details-initial-data.util.ts'
import type { BackupRepositoryType, ParsedBackupRepositoryUrl } from 'xo-remote-parser'

export const NFS_DEFAULT_PORT = '2049'

export const SMB_DEFAULT_DOMAIN = 'WORKGROUP'

export function buildLocalBackupRepositoryDetailsPayload(
  formData: LocalBackupRepositoryDetailsFormData
): BackupRepositoryDetailsPayload {
  return {
    urlInfo: {
      type: 'file',
      path: formData.path,
    },
  }
}

export function buildNfsBackupRepositoryDetailsPayload(
  formData: NfsBackupRepositoryDetailsFormData
): BackupRepositoryDetailsPayload {
  return {
    urlInfo: {
      type: 'nfs',
      host: formData.host,
      port: formData.port !== '' ? formData.port : NFS_DEFAULT_PORT,
      path: formData.path,
    },
    ...(formData.customOptions !== '' && { options: formData.customOptions }),
  }
}

export function buildSmbBackupRepositoryDetailsPayload(
  formData: SmbBackupRepositoryDetailsFormData
): BackupRepositoryDetailsPayload {
  return {
    urlInfo: {
      type: 'smb',
      host: formData.pathOnShare,
      path: formData.subfolder,
      domain: formData.domain !== '' ? formData.domain : SMB_DEFAULT_DOMAIN,
      username: formData.username,
      password: formData.password,
    },
    ...(formData.customOptions !== '' && { options: formData.customOptions }),
  }
}

export function buildS3BackupRepositoryDetailsPayload(
  formData: S3BackupRepositoryDetailsFormData
): BackupRepositoryDetailsPayload {
  return {
    urlInfo: {
      type: 's3',
      protocol: formData.useHttps ? 'https' : 'http',
      host: formData.endpoint,
      path: `${formData.bucket}/${formData.pathInBucket}`,
      region: formData.region,
      username: formData.accessKeyId,
      password: formData.secret,
      ...(formData.allowUnauthorized && { allowUnauthorized: true }),
    },
  }
}

export function buildAzureBackupRepositoryDetailsPayload(
  formData: AzureBackupRepositoryDetailsFormData,
  type: BackupRepositoryType | undefined
): BackupRepositoryDetailsPayload {
  return {
    urlInfo: {
      type: type === 'azurite' ? 'azurite' : 'azure',
      protocol: formData.useHttps ? 'https' : 'http',
      host: formData.hostName,
      path: `${formData.containerName}/${formData.pathInContainer}`,
      username: formData.accountName,
      password: formData.key,
    },
  }
}

export function buildBackupRepositoryDetailsPayload(
  parsedUrl: ParsedBackupRepositoryUrl,
  options: FrontXoBackupRepository['options'],
  changes: Record<string, unknown>
): BackupRepositoryDetailsPayload | undefined {
  const initialData = getBackupRepositoryDetailsInitialData(parsedUrl, options)

  switch (parsedUrl.type) {
    case 'file':
      return buildLocalBackupRepositoryDetailsPayload({
        ...initialData.file,
        ...changes,
      } as LocalBackupRepositoryDetailsFormData)
    case 'nfs':
      return buildNfsBackupRepositoryDetailsPayload({
        ...initialData.nfs,
        ...changes,
      } as NfsBackupRepositoryDetailsFormData)
    case 'smb':
      return buildSmbBackupRepositoryDetailsPayload({
        ...initialData.smb,
        ...changes,
      } as SmbBackupRepositoryDetailsFormData)
    case 's3':
      return buildS3BackupRepositoryDetailsPayload({
        ...initialData.s3,
        ...changes,
      } as S3BackupRepositoryDetailsFormData)
    case 'azure':
    case 'azurite':
      return buildAzureBackupRepositoryDetailsPayload(
        { ...initialData.azure, ...changes } as AzureBackupRepositoryDetailsFormData,
        parsedUrl.type
      )
    default:
      return undefined
  }
}
