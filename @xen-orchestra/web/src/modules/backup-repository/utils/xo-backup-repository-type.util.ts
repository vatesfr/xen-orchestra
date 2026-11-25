import { parseBackupRepositoryUrlSafely } from '@/modules/backup-repository/utils/xo-backup-repository-parsed-url.util.ts'
import type { BackupRepositoryType } from 'xo-remote-parser'

export function getBackupRepositoryType(url: string): BackupRepositoryType | undefined {
  return parseBackupRepositoryUrlSafely(url)?.type
}
