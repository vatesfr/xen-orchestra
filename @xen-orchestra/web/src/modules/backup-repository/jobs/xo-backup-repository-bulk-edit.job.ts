import { xoBackupRepositoriesArg } from '@/modules/backup-repository/jobs/xo-backup-repository-args.ts'
import { bulkEditPayloadsArg } from '@/modules/backup-repository/jobs/xo-backup-repository-bulk-edit-args.ts'
import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { checkBackupRepositoryHealth } from '@/modules/backup-repository/utils/xo-backup-repository-health.util.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type BulkEditBackupRepositoryPayloads = Map<FrontXoBackupRepository['id'], EditBackupRepositoryPayload>

export const useXoBackupRepositoryBulkEditJob = defineJob(
  'backup-repository.bulk-edit',
  [xoBackupRepositoriesArg, bulkEditPayloadsArg],
  () => {
    const { t } = useI18n()

    return {
      async run(brs: FrontXoBackupRepository[], payloads: BulkEditBackupRepositoryPayloads | undefined) {
        if (payloads === undefined || brs.some(br => !payloads.has(br.id))) {
          throw new JobError(t('job:backup-repository-bulk-edit:missing-payload'))
        }

        const results = await Promise.allSettled(
          brs.map(async br => {
            await fetchPatch(`backup-repositories/${br.id}`, payloads.get(br.id))

            await checkBackupRepositoryHealth(br.id)
          })
        )

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to edit backup repository ${brs[index]?.id}:`, result.reason)
          }
        })

        return results
      },

      validate: (isRunning, brs: FrontXoBackupRepository[] | undefined) => {
        if (!brs || brs.length === 0) {
          throw new JobError(t('job:backup-repository-bulk-edit:missing-backup-repository'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:backup-repository-bulk-edit:in-progress'))
        }
      },
    }
  }
)
