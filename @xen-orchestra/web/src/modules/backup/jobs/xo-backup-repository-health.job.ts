import { xoBackupRepositoryIdArg } from '@/modules/backup/jobs/xo-backup-repository-args.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { fetchRequest } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoBackupRepositoryHealthJob = defineJob('backup-repository.health', [xoBackupRepositoryIdArg], () => {
  const { t } = useI18n()

  return {
    async run(id: FrontXoBackupRepository['id']) {
      await fetchRequest(`backup-repositories/${id}/health`)
    },

    validate: (isRunning, id: FrontXoBackupRepository['id'] | undefined) => {
      if (id === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:backup-repository-health:in-progress'))
      }
    },
  }
})
