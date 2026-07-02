import { useXoVifDeleteJob } from '@/modules/vif/jobs/xo-vif-delete.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useVifDeleteModal(rawVifs: MaybeRefOrGetter<FrontXoVif[]>) {
  const vifs = toComputed(rawVifs)

  const { run, canRun, isRunning } = useXoVifDeleteJob(vifs)

  const openModal = useOverlay(() => ({
    component: import('@/modules/vif/components/modal/VifDeleteModal.vue'),
    props: { count: vifs.value.length },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when deleting VIF:', error)
      }
    },
  }))

  return { openModal, canRun, isRunning }
}
