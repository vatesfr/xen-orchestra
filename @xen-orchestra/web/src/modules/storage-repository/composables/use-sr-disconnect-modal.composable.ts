import { useXoSrDisconnectJob } from '@/modules/storage-repository/jobs/xo-sr-disconnect.job.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useSrDisconnectModal(rawSrs: MaybeRefOrGetter<FrontXoSr[]>) {
  const srs = toComputed(rawSrs)

  const { run, canRun, isRunning, errorMessage } = useXoSrDisconnectJob(srs)

  const openModal = useModal(() => ({
    component: import('@/modules/storage-repository/components/modal/SrDisconnectModal.vue'),
    props: { count: srs.value.length },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error(`Error when disconnecting SR:`, error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
