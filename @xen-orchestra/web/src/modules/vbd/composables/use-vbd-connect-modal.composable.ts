import { useXoVbdConnectJob } from '@/modules/vbd/jobs/xo-vbd-connect.job.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'

export function useVbdConnectModal(vbds: () => FrontXoVbd[], vm: () => FrontXoVm) {
  const { run, canRun, isRunning } = useXoVbdConnectJob(vbds, vm)

  const openModal = useModal({
    component: import('@/modules/vbd/components/modal/VbdConnectModal.vue'),
    props: { count: vbds().length },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when connecting VBD:', error)
      }
    },
  })

  return { openModal, canRun, isRunning }
}
