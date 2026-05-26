import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { xoVmSnapshotArg } from '@/modules/snapshot/jobs/xo-vm-snapshot-args.ts'
import { xoVmSnapshotBeforeArg } from '@/modules/snapshot/jobs/xo-vm-snapshot-before-args.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoVmSnapshotRevertJob = defineJob(
  'vm-snapshot.revert',
  [xoVmSnapshotArg, xoVmSnapshotBeforeArg],
  () => {
    const { t } = useI18n()
    const { monitorTask } = useXoTaskUtils()

    return {
      async run(snapshot: FrontXoVmSnapshot, snapshotBefore: boolean) {
        const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(
          `vms/${snapshot.$snapshot_of}/actions/revert_snapshot`,
          { snapshotId: snapshot.id, snapshotBefore }
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
  }
)
