import { xoBackupRepositoryArg } from '@/modules/backup-repository/jobs/xo-backup-repository-args.ts'
import { editPayloadArg } from '@/modules/backup-repository/jobs/xo-backup-repository-edit-args.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { fetchGet, fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

export type EditBackupRepositoryPayload = {
  name: string
  url: string
  options: string | null
  proxy: FrontXoProxy['id'] | null
}

export const useXoBackupRepositoryEditJob = defineJob('br.edit', [xoBackupRepositoryArg, editPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(br: FrontXoBackupRepository, payload: EditBackupRepositoryPayload) {
      await fetchPatch(`backup-repositories/${br.id}`, payload)

      // Mount the BR once so the server records its immediate status (error or not)
      // A failure here must not fail the edition: the BR exists and its error is stored on it
      await fetchGet(`backup-repositories/${br.id}/health`).catch(() => {})
    },

    validate(isRunning, br: FrontXoBackupRepository | undefined, payload: EditBackupRepositoryPayload | undefined) {
      if (br === undefined) {
        throw new JobError(t('job:arg:backup-repository-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

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
    },
  }
})
