import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoaSnapshotJob = defineJob('xoa.snapshot', [], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    // TEMP: chemin à confirmer côté back, le serveur résout lui-même la VM XOA à snapshoter
    async run() {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>('plugins/xoa/actions/snapshot')

      await monitorTask(taskId)
    },

    validate(isRunning) {
      if (isRunning) {
        throw new JobRunningError(t('job:xoa-snapshot:in-progress'))
      }
    },
  }
})
