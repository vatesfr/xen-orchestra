import { useXoVdiDeleteJob } from '@/modules/vdi/jobs/xo-vdi-delete.job.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'

export function useVdiDeleteModal(vdis: () => FrontXoVdi[]) {
  const { run, canRun, isRunning } = useXoVdiDeleteJob(vdis)

  const openModal = useModal({
    component: import('@/modules/vdi/components/modal/VdiDeleteModal.vue'),
    props: { count: 1 },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when deleting VDI:', error)
      }
    },
  })

  return { openModal, canRun, isRunning }
}
