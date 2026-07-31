import { useXoVbdConnectJob } from '@/modules/vbd/jobs/xo-vbd-connect.job.ts'
import { useXoVbdDisconnectJob } from '@/modules/vbd/jobs/xo-vbd-disconnect.job.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useVbdConnection(options: { vbds: MaybeRefOrGetter<FrontXoVbd[]>; vm: MaybeRefOrGetter<FrontXoVm> }) {
  const vbds = toComputed(options.vbds)
  const vm = toComputed(options.vm)

  const {
    run: connectVbds,
    canRun: canConnectVbd,
    isRunning: isConnectingVbd,
    errorMessage: connectVbdErrorMessage,
  } = useXoVbdConnectJob(vbds, vm)

  const {
    run: disconnectVbds,
    canRun: canDisconnectVbd,
    isRunning: isDisconnectingVbd,
    errorMessage: disconnectVbdErrorMessage,
  } = useXoVbdDisconnectJob(vbds, vm)

  const { open } = useOverlay({
    component: () => import('@/modules/vbd/components/modal/VbdConnectionModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  function connectVbd() {
    return open({
      props: {
        action: CONNECTION_ACTION.CONNECT,
        count: vbds.value.length,
      },
      events: {
        onConfirm: async () => {
          try {
            await connectVbds()
          } catch (error) {
            console.error('Error when connecting VBD:', error)
          }
        },
      },
    })
  }

  function disconnectVbd() {
    return open({
      props: {
        action: CONNECTION_ACTION.DISCONNECT,
        count: vbds.value.length,
      },
      events: {
        onConfirm: async () => {
          try {
            await disconnectVbds()
          } catch (error) {
            console.error('Error when disconnecting VBD:', error)
          }
        },
      },
    })
  }

  return {
    connectVbd,
    disconnectVbd,
    canConnectVbd,
    canDisconnectVbd,
    isConnectingVbd,
    isDisconnectingVbd,
    connectVbdErrorMessage,
    disconnectVbdErrorMessage,
  }
}
