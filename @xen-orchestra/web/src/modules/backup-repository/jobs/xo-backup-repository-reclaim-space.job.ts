import { xoBackupRepositoriesArg } from '@/modules/backup-repository/jobs/xo-backup-repository-args.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoBackupRepositoryReclaimSpaceJob = defineJob(
  'backup-repository.reclaim-space',
  [xoBackupRepositoriesArg],
  () => {
    const { t } = useI18n()
    const { monitorTask } = useXoTaskUtils()

    return {
      async run(brs: FrontXoBackupRepository[]) {
        const results = await Promise.allSettled(
          brs.map(async br => {
            const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(
              `backup-repositories/${br.id}/actions/reclaim-space`
            )

            return monitorTask(taskId)
          })
        )

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to reclaim space on backup repository ${brs[index]?.id}:`, result.reason)
          }
        })

        return results
      },

      validate: (isRunning, brs: FrontXoBackupRepository[] | undefined) => {
        if (!brs || brs.length === 0) {
          throw new JobError(t('job:backup-repository-reclaim-space:missing-backup-repository'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:backup-repository-reclaim-space:in-progress'))
        }

        const disabledBrsCount = brs.filter(br => !br.enabled).length

        if (disabledBrsCount > 0) {
          throw new JobError(
            brs.length === 1
              ? t('job:backup-repository-reclaim-space:repository-disabled')
              : t('job:backup-repository-reclaim-space:n-repositories-disabled', { n: disabledBrsCount })
          )
        }
      },
    }
  }
)
