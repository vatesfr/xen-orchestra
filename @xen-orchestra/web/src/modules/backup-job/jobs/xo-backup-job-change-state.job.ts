import { xoBackupJobEnabledArg, xoBackupJobsArg } from '@/modules/backup-job/jobs/xo-backup-job-args.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoBackupJobChangeStateJob = defineJob(
  'backup-job.change-state',
  [xoBackupJobsArg, xoBackupJobEnabledArg],
  () => {
    const { t } = useI18n()
    const { schedulesByJobId } = useXoScheduleCollection()

    const getSchedules = (backupJob: FrontAnyXoBackupJob) => schedulesByJobId.value.get(backupJob.id) ?? []

    return {
      async run(backupJobs: FrontAnyXoBackupJob[], enabled: boolean) {
        const results = await Promise.allSettled(
          backupJobs.map(backupJob => fetchPatch(`schedules/${getSchedules(backupJob)[0]?.id}`, { enabled }))
        )

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to change state of backup job ${backupJobs[index]?.id}:`, result.reason)
          }
        })

        return results
      },

      validate: (isRunning, backupJobs: FrontAnyXoBackupJob[] | undefined) => {
        if (!backupJobs || backupJobs.length === 0) {
          throw new JobError(t('job:backup-job-change-state:missing-backup-job'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:backup-job-change-state:in-progress'))
        }

        if (backupJobs.some(backupJob => getSchedules(backupJob).length > 1)) {
          throw new JobError(t('job:backup-job-change-state:multiple-schedules', { n: backupJobs.length }))
        }

        if (backupJobs.some(backupJob => getSchedules(backupJob).length === 0)) {
          throw new JobError(t('job:backup-job-change-state:no-schedule', { n: backupJobs.length }))
        }
      },
    }
  }
)
