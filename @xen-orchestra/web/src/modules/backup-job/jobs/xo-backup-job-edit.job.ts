import { xoBackupJobArg } from '@/modules/backup-job/jobs/xo-backup-job-args.ts'
import { editPayloadArg } from '@/modules/backup-job/jobs/xo-backup-job-edit-args.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { type BackupJobPayload, mergeBackupJobSettings } from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { omit } from 'lodash-es'
import { useI18n } from 'vue-i18n'

export type EditBackupJobPayload = BackupJobPayload

export const useXoBackupJobEditJob = defineJob('backup-job.edit', [xoBackupJobArg, editPayloadArg], () => {
  const { t } = useI18n()
  const { schedulesByJobId } = useXoScheduleCollection()

  return {
    async run(backupJob: FrontAnyXoBackupJob, payload: EditBackupJobPayload | undefined) {
      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      await fetchPatch(`backup-jobs/${backupJob.id}`, {
        ...omit(payload, ['type', 'schedules']),
        settings: mergeBackupJobSettings(backupJob.settings, payload.settings),
      })

      await Promise.all(
        Object.entries(payload.schedules).map(([scheduleId, schedule]) =>
          fetchPatch(`schedules/${scheduleId}`, schedule)
        )
      )
    },

    validate(isRunning, backupJob: FrontAnyXoBackupJob | undefined) {
      if (backupJob === undefined) {
        throw new JobError(t('job:arg:backup-job-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      const scheduleCount = schedulesByJobId.value.get(backupJob.id)?.length ?? 0

      if (scheduleCount === 0) {
        throw new JobError(t('job:backup-job-edit:no-schedule'))
      }

      if (scheduleCount > 1) {
        throw new JobError(t('job:backup-job-edit:multiple-schedules'))
      }
    },
  }
})
