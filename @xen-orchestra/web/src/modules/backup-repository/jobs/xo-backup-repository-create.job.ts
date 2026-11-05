import type { BackupRepositoryPayload } from '@/modules/backup-repository/form/use-backup-repository-form-base.ts'
import { payloadsArg } from '@/modules/backup-repository/jobs/xo-backup-repository-create-args.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { checkBackupRepositoryHealth } from '@/modules/backup-repository/utils/xo-backup-repository-health.util.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

export type NewBackupRepositoryPayload = BackupRepositoryPayload

export const useXoBackupRepositoryCreateJob = defineJob('br.create', [payloadsArg], () => {
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<FrontXoBackupRepository['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { id } = await fetchPost<{ id: FrontXoBackupRepository['id'] }>(`backup-repositories`, payload)

          await checkBackupRepositoryHealth(id)

          return id
        })
      )
    },

    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payloads.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      payloads.forEach(payload => {
        if (payload.name === '') {
          throw new JobError(t('job:arg:name-required'))
        }

        if (payload.url === '') {
          throw new JobError(t('job:arg:url-required'))
        }

        const brInfo = parseBackupRepositoryUrl(payload.url)

        if (brInfo.encryptionKey !== undefined && brInfo.useVhdDirectory !== true) {
          throw new JobError(t('job:backup-repository-create:encryption-requires-block'))
        }
      })
    },
  }
})
