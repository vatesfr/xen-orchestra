import { useXoVbdDisconnectJob } from '@/modules/vbd/jobs/xo-vbd-disconnect.job.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useVbdDisconnectModal(rawVbds: MaybeRefOrGetter<FrontXoVbd[]>, rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vbds = toComputed(rawVbds)
  const vm = toComputed(rawVm)

  const { run, canRun, isRunning, errorMessage } = useXoVbdDisconnectJob(vbds, vm)

  const openModal = useModal({
    component: import('@/modules/vbd/components/modal/VbdDisconnectModal.vue'),
    props: { count: vbds.value.length },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when disconnecting VBD:', error)
      }
    },
  })

  return { openModal, canRun, isRunning, errorMessage }
}
