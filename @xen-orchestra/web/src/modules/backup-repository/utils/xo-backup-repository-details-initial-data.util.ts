import type { BackupRepositoryDetailsInitialData } from '@/modules/backup-repository/form/use-backup-repository-form-base.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { splitBackupRepositoryPath } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import type { ParsedBackupRepositoryUrl } from 'xo-remote-parser'

function splitPathForForm(path: string): { root: string; subPath: string } {
  const { root, subPath } = splitBackupRepositoryPath(path)

  return { root, subPath: subPath.replace(/^\/+/, '') }
}

export function getBackupRepositoryDetailsInitialData(
  parsedUrl: ParsedBackupRepositoryUrl,
  options: FrontXoBackupRepository['options']
): BackupRepositoryDetailsInitialData {
  switch (parsedUrl.type) {
    case 'file':
      return { file: { path: parsedUrl.path } }

    case 'nfs':
      return {
        nfs: {
          host: parsedUrl.host,
          port: parsedUrl.port ?? '',
          path: parsedUrl.path,
          customOptions: options ?? '',
        },
      }

    case 'smb':
      return {
        smb: {
          pathOnShare: parsedUrl.host,
          subfolder: parsedUrl.path,
          domain: parsedUrl.domain,
          username: parsedUrl.username,
          password: parsedUrl.password,
          customOptions: options ?? '',
        },
      }

    case 's3': {
      const { root, subPath } = splitPathForForm(parsedUrl.path)

      return {
        s3: {
          endpoint: parsedUrl.host,
          useHttps: parsedUrl.protocol === 'https',
          allowUnauthorized: parsedUrl.allowUnauthorized === true,
          region: parsedUrl.region ?? '',
          accessKeyId: parsedUrl.username,
          secret: parsedUrl.password,
          bucket: root,
          pathInBucket: subPath,
        },
      }
    }

    case 'azure':
    case 'azurite': {
      const { root, subPath } = splitPathForForm(parsedUrl.path)

      return {
        azure: {
          hostName: parsedUrl.host,
          useHttps: parsedUrl.protocol === 'https',
          accountName: parsedUrl.username,
          key: parsedUrl.password,
          containerName: root,
          pathInContainer: subPath,
        },
      }
    }

    default:
      return {}
  }
}
