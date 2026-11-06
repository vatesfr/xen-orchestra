import { payloadArg } from '@/modules/backup-job/jobs/xo-backup-job-create-args.ts'
import type { BackupJobPayload } from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type NewBackupJobPayload = BackupJobPayload

export const useXoBackupJobCreateJob = defineJob('backup-job.create', [payloadArg], () => {
  const { t } = useI18n()

  return {
    async run(payload: NewBackupJobPayload): Promise<string> {
      const { id } = await fetchPost<{ id: string }>('backup-jobs', payload)

      return id
    },

    validate(isRunning, payload: NewBackupJobPayload | undefined) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (payload.name.trim() === '') {
        throw new JobError(t('job:arg:name-required'))
      }
    },
  }
})
