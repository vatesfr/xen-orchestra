import { useXoVifDisconnectJob } from '@/modules/vif/jobs/xo-vif-disconnect.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useVifDisconnectModal(rawVifs: MaybeRefOrGetter<FrontXoVif[]>, rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vifs = toComputed(rawVifs)
  const vm = toComputed(rawVm)

  const { run, canRun, isRunning, errorMessage } = useXoVifDisconnectJob(vifs, vm)

  const openModal = useModal({
    component: import('@/modules/vif/components/modal/VifDisconnectModal.vue'),
    props: { count: vifs.value.length },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when disconnecting VIF:', error)
      }
    },
  })

  return { openModal, canRun, isRunning, errorMessage }
}
