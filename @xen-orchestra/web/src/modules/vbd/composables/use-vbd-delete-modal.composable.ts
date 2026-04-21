import { useXoVbdDeleteJob } from '@xen-orchestra/web/src/modules/vbd/jobs/xo-vbd-delete.job.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { FrontXoVbd } from '@xen-orchestra/web/src/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useRouteQuery } from '@xen-orchestra/web-core/composables/route-query.composable.ts'
import { useModal } from '@xen-orchestra/web-core/packages/modal/use-modal.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useVbdDeleteModal(rawVbds: MaybeRefOrGetter<FrontXoVbd[]>) {
  const vbds = toComputed(rawVbds)

  const selectedVdiId = useRouteQuery('id')

  const { run, canRun, isRunning } = useXoVbdDeleteJob(vbds)

  const openModal = useModal({
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
  })

  return { openModal, canRun, isRunning }
}
