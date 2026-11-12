import { xoBackupJobsArg } from '@/modules/backup-job/jobs/xo-backup-job-args.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { getBackupJobDuplicatePayload } from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoBackupJobDuplicateJob = defineJob('backup-job.duplicate', [xoBackupJobsArg], () => {
  const { t } = useI18n()
  const { schedulesByJobId } = useXoScheduleCollection()

  return {
    async run(backupJobs: FrontAnyXoBackupJob[]) {
      const results = await Promise.allSettled(
        backupJobs.map(backupJob =>
          fetchPost<{ id: FrontAnyXoBackupJob['id'] }>(
            'backup-jobs',
            getBackupJobDuplicatePayload(
              backupJob,
              schedulesByJobId.value.get(backupJob.id) ?? [],
              t('backup-job-copy-name', { name: backupJob.name ?? t('untitled') })
            )
          )
        )
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to duplicate backup job ${backupJobs[index]?.id}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, backupJobs: FrontAnyXoBackupJob[] | undefined) => {
      if (!backupJobs || backupJobs.length === 0) {
        throw new JobError(t('job:backup-job-duplicate:missing-backup-job'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:backup-job-duplicate:in-progress'))
      }
    },
  }
})
