import { useXoVdiDeleteJob } from '@/modules/vdi/jobs/xo-vdi-delete.job.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useVdiDeleteModal(
  rawVdis: MaybeRefOrGetter<FrontXoVdi[]>,
  rawVm: MaybeRefOrGetter<FrontXoVm | undefined>
) {
  const vdis = toComputed(rawVdis)
  const vm = toComputed(rawVm)

  const { run, canRun, isRunning, errorMessage } = useXoVdiDeleteJob(vdis, vm)

  const openModal = useOverlay(() => ({
    component: import('@/modules/vdi/components/modal/VdiDeleteModal.vue'),
    props: { count: vdis.value.length },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when deleting VDI:', error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
