import {
  xoBackupRepositoriesArg,
  xoBackupRepositoryEnabledArg,
} from '@/modules/backup-repository/jobs/xo-backup-repository-args.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoBackupRepositoryChangeStateJob = defineJob(
  'backup-repository.change-state',
  [xoBackupRepositoriesArg, xoBackupRepositoryEnabledArg],
  () => {
    const { t } = useI18n()

    const { $context } = useXoBackupRepositoryCollection()

    return {
      async run(brs: FrontXoBackupRepository[], enabled: boolean) {
        const results = await Promise.allSettled(brs.map(br => fetchPatch(`backup-repositories/${br.id}`, { enabled })))

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to change state of backup repository ${brs[index]?.id}:`, result.reason)
          }
        })

        // Force reload while waiting for reactivity to be implemented for XO objects (XO-1013)
        $context.forceReload()

        return results
      },

      validate: (isRunning, brs: FrontXoBackupRepository[] | undefined) => {
        if (!brs || brs.length === 0) {
          throw new JobError(t('job:backup-repository-change-state:missing-backup-repository'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:backup-repository-change-state:in-progress'))
        }
      },
    }
  }
)
