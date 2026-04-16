import { useXoVbdDeleteJob } from '@/modules/vbd/jobs/xo-vbd-delete.job.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'

export function useVdiDetachModal(vbds: () => FrontXoVbd[]) {
  const selectedVdiId = useRouteQuery('id')

  const { run, canRun, isRunning } = useXoVbdDeleteJob(vbds)

  const openModal = useModal({
    component: import('@/modules/vdi/components/modal/VdiDetachModal.vue'),
    props: { count: 1 },
    onConfirm: async () => {
      try {
        await run()
        // TODO need to be improve
        selectedVdiId.value = ''
      } catch (error) {
        console.error('Error when detaching VDI:', error)
      }
    },
  })

  return { openModal, canRun, isRunning }
}
