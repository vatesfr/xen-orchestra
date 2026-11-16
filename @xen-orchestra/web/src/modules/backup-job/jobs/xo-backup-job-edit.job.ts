import { xoBackupJobArg } from '@/modules/backup-job/jobs/xo-backup-job-args.ts'
import { editPayloadArg } from '@/modules/backup-job/jobs/xo-backup-job-edit-args.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { BackupJobPayload } from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type EditBackupJobPayload = Omit<BackupJobPayload, 'type' | 'schedules'>

export const useXoBackupJobEditJob = defineJob('backup-job.edit', [xoBackupJobArg, editPayloadArg], () => {
  const { t } = useI18n()
  const { schedulesByJobId } = useXoScheduleCollection()

  return {
    async run(backupJob: FrontAnyXoBackupJob, payload: EditBackupJobPayload) {
      await fetchPatch(`backup-jobs/${backupJob.id}`, payload)
    },

    validate(isRunning, backupJob: FrontAnyXoBackupJob | undefined, payload: EditBackupJobPayload | undefined) {
      if (backupJob === undefined) {
        throw new JobError(t('job:arg:backup-job-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      if ((schedulesByJobId.value.get(backupJob.id)?.length ?? 0) > 1) {
        throw new JobError(t('job:backup-job-edit:multiple-schedules'))
      }

      // The payload only exists once the edit drawer is confirmed
      if (payload === undefined) {
        return
      }

      if (payload.name.trim() === '') {
        throw new JobError(t('job:arg:name-required'))
      }
    },
  }
})
