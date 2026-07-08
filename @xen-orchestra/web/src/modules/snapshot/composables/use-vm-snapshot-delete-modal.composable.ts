import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoVmSnapshotDeleteJob } from '@/modules/snapshot/jobs/xo-vm-snapshot-delete.job.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVmSnapshotDeleteModal(rawSnapshots: MaybeRefOrGetter<FrontXoVmSnapshot[]>) {
  const snapshots = toComputed(rawSnapshots)

  const { t } = useI18n()

  const { run, canRun, isRunning } = useXoVmSnapshotDeleteJob(snapshots)

  const { open } = useDeleteModal()

  function openModal() {
    const count = snapshots.value.length

    return open({
      events: {
        onConfirm: async () => {
          try {
            await run()
          } catch (error) {
            console.error('Error when deleting snapshot:', error)
          }
        },
      },
      props: {
        subject: t('n-snapshots', { n: count }),
        description: t('snapshot-delete-warning', { n: count }),
        confirmLabel: t('action:delete-n-snapshots', { n: count }),
      },
    })
  }

  return { openModal, canRun, isRunning }
}
