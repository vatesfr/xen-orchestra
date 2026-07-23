import { useSrDeleteJob } from '@/jobs/sr-delete.job.ts'
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useSrDeleteModal(rawSrs: MaybeRefOrGetter<XenApiSr[]>) {
  const srs = toComputed(rawSrs)

  const selectedSrId = useRouteQuery('id')

  const { run, canRun, isRunning, errorMessage } = useSrDeleteJob(srs)

  const openModal = useModal(() => ({
    component: import('@/modules/storage-repository/components/modal/SrDeleteModal.vue'),
    props: { count: srs.value.length },
    onConfirm: async () => {
      try {
        await run()

        if (srs.value.some(sr => sr.uuid === selectedSrId.value)) {
          selectedSrId.value = ''
        }
      } catch (error) {
        console.error('Error when deleting SR:', error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
