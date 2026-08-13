import { useXoServerDisconnectJob } from '@/modules/server/jobs/xo-server-disconnect.job.ts'
import {
  useXoServerCollection,
  type FrontXoServer,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useServerDisconnect(rawServerId: MaybeRefOrGetter<FrontXoServer['id']>) {
  const serverId = toComputed(rawServerId)

  const { getServerById } = useXoServerCollection()

  const server = computed(() => getServerById(serverId.value))

  const serverLabel = computed(() => server.value?.poolNameLabel ?? server.value?.label ?? '')

  const {
    run,
    canRun: canDisconnectServer,
    isRunning: isDisconnectingServer,
    errorMessage: disconnectServerErrorMessage,
  } = useXoServerDisconnectJob([serverId])

  const { open } = useOverlay({
    component: () => import('@/modules/server/components/modal/ServerDisconnectModal.vue'),
    events: {
      onConfirm: async () => {
        try {
          await run()
        } catch (error) {
          console.error('Error when disconnecting server:', error)
        }
      },
      onCancel: true,
    },
  })

  function disconnectServer() {
    return open({
      props: { title: serverLabel.value },
    })
  }

  return { disconnectServer, canDisconnectServer, isDisconnectingServer, disconnectServerErrorMessage }
}
