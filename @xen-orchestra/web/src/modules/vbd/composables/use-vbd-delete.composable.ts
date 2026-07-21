import { useXoVbdDeleteJob } from '@/modules/vbd/jobs/xo-vbd-delete.job.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useVbdDelete(options: {
  vbds: MaybeRefOrGetter<FrontXoVbd[]>
  vm: MaybeRefOrGetter<FrontXoVm | undefined>
}) {
  const vbds = toComputed(options.vbds)
  const vm = toComputed(options.vm)

  const selectedVdiId = useRouteQuery('id')

  const {
    run,
    canRun: canDeleteVbds,
    isRunning: isDeletingVbds,
    errorMessage: deleteVbdsErrorMessage,
  } = useXoVbdDeleteJob(vbds, vm)

  const { open } = useOverlay({
    component: () => import('@/modules/vbd/components/modal/VbdDeleteModal.vue'),
    events: {
      onConfirm: async () => {
        try {
          await run()
          // TODO need to be improve
          selectedVdiId.value = ''
        } catch (error) {
          console.error('Error when deleting VBD:', error)
        }
      },
      onCancel: true,
    },
  })

  function deleteVbds() {
    return open({ props: { count: vbds.value.length } })
  }

  return { deleteVbds, canDeleteVbds, isDeletingVbds, deleteVbdsErrorMessage }
}
