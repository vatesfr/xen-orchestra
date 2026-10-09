import { useXoBackupJobCollection } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import { xoBackupRepositoriesArg } from '@/modules/backup-repository/jobs/xo-backup-repository-args.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupJobsUsingBackupRepository } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoBackupRepositoryForgetJob = defineJob('backup-repository.forget', [xoBackupRepositoriesArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()
  const { backupJobs } = useXoBackupJobCollection()

  const { $context } = useXoBackupRepositoryCollection()

  return {
    async run(brs: FrontXoBackupRepository[]) {
      const results = await Promise.allSettled(
        brs.map(async br => {
          const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(
            `backup-repositories/${br.id}/actions/forget`
          )

          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to forget backup repository ${brs[index]?.id}:`, result.reason)
        }
      })

      // Force reload while waiting for reactivity to be implemented for XO objects (XO-1013)
      $context.forceReload()

      return results
    },

    validate: (isRunning, brs: FrontXoBackupRepository[] | undefined) => {
      if (!brs || brs.length === 0) {
        throw new JobError(t('job:backup-repository-forget:missing-backup-repository'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:backup-repository-forget:in-progress'))
      }

      const usingBackupJobs = new Set(brs.flatMap(br => getBackupJobsUsingBackupRepository(br, backupJobs.value)))

      if (usingBackupJobs.size > 0) {
        throw new JobError(t('job:backup-repository-forget:used-by-n-backup-jobs', { n: usingBackupJobs.size }))
      }
    },
  }
})
