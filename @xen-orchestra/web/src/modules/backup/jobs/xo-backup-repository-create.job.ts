import { payloadsArg } from '@/modules/backup/jobs/xo-backup-repository-create-args.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { parseBackupRepositoryUrl } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { fetchGet, fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type NewBackupRepositoryPayload = {
  name: string
  url: string
  options?: string
  proxy?: FrontXoProxy['id']
}

export const useXoBackupRepositoryCreateJob = defineJob('br.create', [payloadsArg], () => {
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<FrontXoBackupRepository['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { id } = await fetchPost<{ id: FrontXoBackupRepository['id'] }>(`backup-repositories`, payload)

          await fetchGet(`backup-repositories/${id}/health`).catch(() => {})

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

        if (brInfo?.encryptionKey !== undefined && brInfo.useVhdDirectory !== true) {
          throw new JobError(t('job:backup-repository-create:encryption-requires-block'))
        }
      })
    },
  }
})
