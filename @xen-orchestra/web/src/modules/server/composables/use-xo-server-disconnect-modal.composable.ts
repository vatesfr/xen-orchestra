import { useXoServerDisconnectJob } from '@/modules/server/jobs/xo-server-disconnect.job.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useServerDisconnectModal(rawServerId: MaybeRefOrGetter<FrontXoServer['id']>) {
  const serverId = toComputed(rawServerId)

  const { isRunning, canRun, errorMessage, run } = useXoServerDisconnectJob([serverId])

  const openModal = useModal(() => ({
    component: import('@/modules/pool/components/actions/connection/PoolDisconnectConfirmModal.vue'),
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when disconnecting server:', error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
