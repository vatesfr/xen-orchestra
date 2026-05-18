import { useXoSrDeleteJob } from '@xen-orchestra/web/src/modules/storage-repository/jobs/xo-sr-delete.job.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { FrontXoSr } from '@xen-orchestra/web/src/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useModal } from '@xen-orchestra/web-core/packages/modal/use-modal.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useSrDeleteModal(rawSrs: MaybeRefOrGetter<FrontXoSr[]>) {
  const srs = toComputed(rawSrs)

  const selectedSrId = useRouteQuery('id')

  const { run, canRun, isRunning } = useXoSrDeleteJob(srs)

  const openModal = useModal(() => ({
    component: import('@/modules/storage-repository/components/modal/SrDeleteModal.vue'),
    props: { count: srs.value.length },
    onConfirm: async () => {
      try {
        await run()

        if (srs.value.some(sr => sr.id === selectedSrId.value)) {
          selectedSrId.value = ''
        }
      } catch (error) {
        console.error('Error when deleting SR:', error)
      }
    },
  }))

  return { openModal, canRun, isRunning }
}
