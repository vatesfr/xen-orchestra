import {
  xoBackupRepositoryArg,
  xoBackupRepositoryEnabledArg,
} from '@/modules/backup-repository/jobs/xo-backup-repository-args.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoBackupRepositoryChangeStateJob = defineJob(
  'backup-repository.change-state',
  [xoBackupRepositoryArg, xoBackupRepositoryEnabledArg],
  () => {
    const { t } = useI18n()

    return {
      async run(br: FrontXoBackupRepository, enabled: boolean) {
        await fetchPatch(`backup-repositories/${br.id}`, { enabled })
      },

      validate: (isRunning, br: FrontXoBackupRepository | undefined, enabled: boolean | undefined) => {
        if (br === undefined) {
          throw new JobError(t('job:backup-repository-change-state:missing-backup-repository'))
        }

        if (enabled === undefined) {
          throw new JobError(t('job:backup-repository-change-state:missing-state'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:backup-repository-change-state:in-progress'))
        }
      },
    }
  }
)
