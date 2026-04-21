import { useXoVifDeleteJob } from '@/modules/vif/jobs/xo-vif-delete.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'

export function useVifDeleteModal(vifs: () => FrontXoVif[]) {
  const { run, canRun, isRunning } = useXoVifDeleteJob(vifs)

  const openModal = useModal({
    component: import('@/modules/vif/components/modal/VifDeleteModal.vue'),
    props: { count: vifs().length },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when deleting VIF:', error)
      }
    },
  })

  return { openModal, canRun, isRunning }
}
