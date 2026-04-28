import { useXoVifDeleteJob } from '@/modules/vif/jobs/xo-vif-delete.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from '@vueuse/shared'

export function useVifDeleteModal(rawVifs: MaybeRefOrGetter<FrontXoVif[]>) {
  const vifs = toComputed(rawVifs)

  const { run, canRun, isRunning } = useXoVifDeleteJob(vifs)

  const openModal = useModal({
    component: import('@/modules/vif/components/modal/VifDeleteModal.vue'),
    props: { count: vifs.value.length },
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
