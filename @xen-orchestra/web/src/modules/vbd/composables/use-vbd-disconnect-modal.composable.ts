import { useXoVbdDisconnectJob } from '@/modules/vbd/jobs/xo-vbd-disconnect.job.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'

export function useVbdDisconnectModal(vbds: () => FrontXoVbd[], vm: () => FrontXoVm) {
  const { run, canRun, isRunning } = useXoVbdDisconnectJob(vbds, vm)

  const openModal = useModal({
    component: import('@/modules/vbd/components/modal/VbdDisconnectModal.vue'),
    props: { count: vbds().length },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when disconnecting VBD:', error)
      }
    },
  })

  return { openModal, canRun, isRunning }
}
