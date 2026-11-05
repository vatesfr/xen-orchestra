import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { xoVmSnapshotsArg } from '@/modules/snapshot/jobs/xo-vm-snapshot-args.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoVmSnapshotDeleteJob = defineJob('vm-snapshot.delete', [xoVmSnapshotsArg], () => {
  const { t } = useI18n()

  return {
    async run(snapshots: FrontXoVmSnapshot[]) {
      const results = await Promise.allSettled(
        snapshots.map(async snapshot => {
          return await fetchDelete(`vm-snapshots/${snapshot.id}`)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete snapshot ${snapshots[index].id}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, snapshots: FrontXoVmSnapshot[]) => {
      if (!snapshots || snapshots.length === 0) {
        throw new JobError(t('job:snapshot-delete:missing-snapshot'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }
    },
  }
})
