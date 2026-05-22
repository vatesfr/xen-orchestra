import { useXoVbdDeleteJob } from '@/modules/vbd/jobs/xo-vbd-delete.job.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useVbdDeleteModal(rawVbds: MaybeRefOrGetter<FrontXoVbd[]>, rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vbds = toComputed(rawVbds)
  const vm = toComputed(rawVm)

  const selectedVdiId = useRouteQuery('id')

  const { run, canRun, isRunning, errorMessage } = useXoVbdDeleteJob(vbds, vm)

  const openModal = useModal(() => ({
    component: import('@/modules/vbd/components/modal/VbdDeleteModal.vue'),
    props: { count: vbds.value.length },
    onConfirm: async () => {
      try {
        await run()
        // TODO need to be improve
        selectedVdiId.value = ''
      } catch (error) {
        console.error('Error when deleting VBD:', error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
