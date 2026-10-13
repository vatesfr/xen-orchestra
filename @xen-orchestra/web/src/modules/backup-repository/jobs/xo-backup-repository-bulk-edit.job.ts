import { xoBackupRepositoriesArg } from '@/modules/backup-repository/jobs/xo-backup-repository-args.ts'
import { editPayloadsArg } from '@/modules/backup-repository/jobs/xo-backup-repository-edit-args.ts'
import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { fetchGet, fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

export type BulkEditBackupRepositoryPayloads = Map<FrontXoBackupRepository['id'], EditBackupRepositoryPayload>

export const useXoBackupRepositoryBulkEditJob = defineJob(
  'backup-repository.bulk-edit',
  [xoBackupRepositoriesArg, editPayloadsArg],
  () => {
    const { t } = useI18n()

    const { $context } = useXoBackupRepositoryCollection()

    return {
      async run(brs: FrontXoBackupRepository[], payloads: BulkEditBackupRepositoryPayloads) {
        const results = await Promise.allSettled(
          brs.map(async br => {
            await fetchPatch(`backup-repositories/${br.id}`, payloads.get(br.id))

            // Mount the BR once so the server records its immediate status (error or not)
            // A failure here must not fail the edition: the BR exists and its error is stored on it
            await fetchGet(`backup-repositories/${br.id}/health`).catch(() => {})
          })
        )

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to edit backup repository ${brs[index]?.id}:`, result.reason)
          }
        })

        // Force reload while waiting for reactivity to be implemented for XO objects (XO-1013)
        $context.forceReload()

        return results
      },

      validate(
        isRunning,
        brs: FrontXoBackupRepository[] | undefined,
        payloads: BulkEditBackupRepositoryPayloads | undefined
      ) {
        if (!brs || brs.length === 0) {
          throw new JobError(t('job:backup-repository-bulk-edit:missing-backup-repository'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:backup-repository-bulk-edit:in-progress'))
        }

        if (payloads === undefined) {
          throw new JobError(t('job:backup-repository-bulk-edit:missing-payload'))
        }

        for (const br of brs) {
          const payload = payloads.get(br.id)

          if (payload === undefined) {
            throw new JobError(t('job:backup-repository-bulk-edit:missing-payload'))
          }

          if (payload.name === '') {
            throw new JobError(t('job:backup-repository-bulk-edit:name-required'))
          }

          if (payload.url === '') {
            throw new JobError(t('job:backup-repository-bulk-edit:url-required'))
          }

          const brInfo = parseBackupRepositoryUrl(payload.url)

          if (brInfo.encryptionKey !== parseBackupRepositoryUrl(br.url).encryptionKey) {
            throw new JobError(t('job:backup-repository-bulk-edit:encryption-key-locked'))
          }

          if (brInfo.encryptionKey !== undefined && brInfo.useVhdDirectory !== true) {
            throw new JobError(t('job:backup-repository-bulk-edit:encryption-requires-block'))
          }
        }
      },
    }
  }
)
