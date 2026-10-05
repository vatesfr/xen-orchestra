import type { FrontAnyXoBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { BackupRepositoryDetailsInitialData } from '@/modules/backup-repository/form/use-backup-repository-details-forms.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { extractIdsFromSimplePattern } from '@/shared/utils/pattern.util.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import type { IconName } from '@core/icons'
import type { BackupRepositoryType, ParsedBackupRepositoryUrl } from 'xo-remote-parser'

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

export function getBackupJobsUsingBackupRepository(
  br: FrontXoBackupRepository,
  backupJobs: FrontAnyXoBackupJob[]
): FrontAnyXoBackupJob[] {
  return backupJobs.filter(
    backupJob =>
      extractIdsFromSimplePattern(backupJob.remotes).includes(br.id) ||
      ('sourceRemote' in backupJob && backupJob.sourceRemote === br.id)
  )
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

function splitPathForForm(path: string): { root: string; subPath: string } {
  const { root, subPath } = splitBackupRepositoryPath(path)

  // buildPayload rebuilds `${root}/${subPath}`: drop the leading slash to avoid `root//sub`
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
