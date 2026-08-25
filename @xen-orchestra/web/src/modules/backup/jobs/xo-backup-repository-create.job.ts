import { payloadsArg } from '@/modules/backup/jobs/xo-backup-repository-create-args.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
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
    },
  }
})
