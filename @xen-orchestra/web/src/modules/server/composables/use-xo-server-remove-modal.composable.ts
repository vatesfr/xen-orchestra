import { useXoServerRemoveJob } from '@/modules/server/jobs/xo-server-remove.job.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useServerRemoveModal(rawServerId: MaybeRefOrGetter<FrontXoServer['id']>) {
  const serverId = toComputed(rawServerId)

  const { isRunning, canRun, errorMessage, run } = useXoServerRemoveJob([serverId])

  const openModal = useModal(() => ({
    component: import('@/modules/pool/components/actions/delete/PoolDeleteConfirmModal.vue'),
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when removing server:', error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
