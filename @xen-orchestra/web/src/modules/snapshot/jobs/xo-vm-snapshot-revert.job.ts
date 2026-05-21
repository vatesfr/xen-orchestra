import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { xoVmSnapshotArg } from '@/modules/snapshot/jobs/xo-vm-snapshot-args.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoVmSnapshotRevertJob = defineJob('vm-snapshot.revert', [xoVmSnapshotArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(snapshot: FrontXoVmSnapshot) {
      const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(
        `vms/${snapshot.$snapshot_of}/actions/revert_snapshot`,
        { snapshotId: snapshot.id }
      )
      await monitorTask(taskId)
    },

    validate: (isRunning, snapshot: FrontXoVmSnapshot | undefined) => {
      if (!snapshot) {
        throw new JobError(t('job:vm-snapshot-revert:missing-snapshot'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:vm-snapshot-revert:in-progress'))
      }
    },
  }
})
