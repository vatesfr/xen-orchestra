import { xoBackupJobsArg } from '@/modules/backup-job/jobs/xo-backup-job-args.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoBackupJobDeleteJob = defineJob('backup-job.delete', [xoBackupJobsArg], () => {
  const { t } = useI18n()

  return {
    async run(backupJobs: FrontAnyXoBackupJob[]) {
      const results = await Promise.allSettled(backupJobs.map(backupJob => fetchDelete(`backup-jobs/${backupJob.id}`)))

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete backup job ${backupJobs[index]?.id}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, backupJobs: FrontAnyXoBackupJob[] | undefined) => {
      if (!backupJobs || backupJobs.length === 0) {
        throw new JobError(t('job:backup-job-delete:missing-backup-job'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:backup-job-delete:in-progress'))
      }
    },
  }
})
