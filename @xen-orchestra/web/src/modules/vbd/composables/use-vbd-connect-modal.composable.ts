import { useXoVbdConnectJob } from '@/modules/vbd/jobs/xo-vbd-connect.job.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useVbdConnectModal(rawVbds: MaybeRefOrGetter<FrontXoVbd[]>, rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vbds = toComputed(rawVbds)
  const vm = toComputed(rawVm)

  const { run, canRun, isRunning, errorMessage } = useXoVbdConnectJob(vbds, vm)

  const openModal = useModal({
    component: import('@/modules/vbd/components/modal/VbdConnectModal.vue'),
    props: { count: vbds.value.length },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when connecting VBD:', error)
      }
    },
  })

  return { openModal, canRun, isRunning, errorMessage }
}
