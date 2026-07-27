import { useXoServerDisconnectJob } from '@/modules/server/jobs/xo-server-disconnect.job.ts'
import {
  useXoServerCollection,
  type FrontXoServer,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useServerDisconnectModal(rawServerId: MaybeRefOrGetter<FrontXoServer['id']>) {
  const serverId = toComputed(rawServerId)

  const { getServerById } = useXoServerCollection()

  const server = computed(() => getServerById(serverId.value))

  const serverLabel = computed(() => server.value?.poolNameLabel ?? server.value?.label ?? '')

  const { run, canRun, isRunning, errorMessage } = useXoServerDisconnectJob([serverId])

  const openModal = useModal(() => ({
    component: import('@/modules/server/components/modal/ServerDisconnectModal.vue'),
    props: { title: serverLabel.value },
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
