import { xoBackupRepositoryArg } from '@/modules/backup-repository/jobs/xo-backup-repository-args.ts'
import { editPayloadArg } from '@/modules/backup-repository/jobs/xo-backup-repository-edit-args.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { checkBackupRepositoryHealth } from '@/modules/backup-repository/utils/xo-backup-repository-health.util.ts'
import { isBackupRepositoryEncrypted } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
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

      await checkBackupRepositoryHealth(br.id)
    },

    validate(isRunning, br: FrontXoBackupRepository | undefined, payload: EditBackupRepositoryPayload | undefined) {
      if (br === undefined) {
        throw new JobError(t('job:arg:backup-repository-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      const currentBrInfo = parseBackupRepositoryUrl(br.url)

      if (currentBrInfo.type === undefined) {
        throw new JobError(t('job:backup-repository-edit:unknown-type'))
      }

      // The payload only exists once the edit drawer is confirmed
      if (payload === undefined) {
        return
      }

      if (payload.name === '') {
        throw new JobError(t('job:arg:name-required'))
      }

      if (payload.url === '') {
        throw new JobError(t('job:arg:url-required'))
      }

      const brInfo = parseBackupRepositoryUrl(payload.url)

      if (brInfo.encryptionKey !== currentBrInfo.encryptionKey) {
        throw new JobError(t('job:backup-repository-edit:encryption-key-locked'))
      }

      if (isBackupRepositoryEncrypted(brInfo) && brInfo.diskFormat !== 'vhdDirectory') {
        throw new JobError(t('job:backup-repository-edit:encryption-requires-block'))
      }
    },
  }
})
