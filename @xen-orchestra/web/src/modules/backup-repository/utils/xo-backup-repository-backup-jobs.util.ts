import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'

export function getBackupJobsUsingBackupRepository(
  brId: FrontXoBackupRepository['id'],
  backupJobs: FrontAnyXoBackupJob[]
): FrontAnyXoBackupJob[] {
  return backupJobs.filter(backupJob => {
    if ('sourceRemote' in backupJob && backupJob.sourceRemote === brId) {
      return true
    }

    if (typeof backupJob.remotes === 'string') {
      return true
    }

    return extractIdsFromSimplePattern(backupJob.remotes).includes(brId)
  })
}
