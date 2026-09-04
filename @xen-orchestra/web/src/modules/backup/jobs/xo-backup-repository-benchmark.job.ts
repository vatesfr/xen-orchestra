import { xoBackupRepositoryArg } from '@/modules/backup/jobs/xo-backup-repository-args.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoBackupRepositoryBenchmarkJob = defineJob(
  'backup-repository.benchmark',
  [xoBackupRepositoryArg],
  () => {
    const { t } = useI18n()
    const { monitorTask } = useXoTaskUtils()

    return {
      async run(br: FrontXoBackupRepository) {
        const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(
          `backup-repositories/${br.id}/actions/benchmark`
        )

        return monitorTask<{ readRate: number; writeRate: number }>(taskId)
      },

      validate: (isRunning, br: FrontXoBackupRepository | undefined) => {
        if (!br) {
          throw new JobError(t('job:backup-repository-benchmark:missing-backup-repository'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:backup-repository-benchmark:in-progress'))
        }

        if (!br.enabled) {
          throw new JobError(t('job:backup-repository-benchmark:repository-disabled'))
        }
      },
    }
  }
)
