import { xoBackupJobsArg } from '@/modules/backup-job/jobs/xo-backup-job-args.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogCollection } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoBackupJobRunJob = defineJob('backup-job.run', [xoBackupJobsArg], () => {
  const { t } = useI18n()
  const { schedulesByJobId } = useXoScheduleCollection()
  const { backupLogsByJobId } = useXoBackupLogCollection()

  const getSchedules = (backupJob: FrontAnyXoBackupJob) => schedulesByJobId.value.get(backupJob.id) ?? []

  const isAlreadyRunning = (backupJob: FrontAnyXoBackupJob) =>
    backupLogsByJobId.value.get(backupJob.id)?.some(backupLog => backupLog.status === 'pending') ?? false

  return {
    async run(backupJobs: FrontAnyXoBackupJob[]) {
      const results = await Promise.allSettled(
        backupJobs.map(backupJob => fetchPost(`schedules/${getSchedules(backupJob)[0]?.id}/actions/run`))
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to run backup job ${backupJobs[index]?.id}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, backupJobs: FrontAnyXoBackupJob[] | undefined) => {
      if (!backupJobs || backupJobs.length === 0) {
        throw new JobError(t('job:backup-job-run:missing-backup-job'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:backup-job-run:in-progress'))
      }

      if (backupJobs.some(backupJob => getSchedules(backupJob).length > 1)) {
        throw new JobError(t('job:backup-job-run:multiple-schedules', { n: backupJobs.length }))
      }

      if (backupJobs.some(backupJob => getSchedules(backupJob).length === 0)) {
        throw new JobError(t('job:backup-job-run:no-schedule', { n: backupJobs.length }))
      }

      if (backupJobs.some(isAlreadyRunning)) {
        throw new JobError(t('job:backup-job-run:already-running', { n: backupJobs.length }))
      }
    },
  }
})
