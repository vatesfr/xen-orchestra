import type { FrontAnyXoBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'

export function getBackupJobsUsingBackupRepository(
  brId: FrontXoBackupRepository['id'],
  backupJobs: FrontAnyXoBackupJob[]
): FrontAnyXoBackupJob[] {
  return backupJobs.filter(
    backupJob =>
      extractIdsFromSimplePattern(backupJob.remotes).includes(brId) ||
      ('sourceRemote' in backupJob && backupJob.sourceRemote === brId)
  )
}
