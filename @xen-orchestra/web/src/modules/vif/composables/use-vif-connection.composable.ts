import { useXoVifConnectJob } from '@/modules/vif/jobs/xo-vif-connect.job.ts'
import { useXoVifDisconnectJob } from '@/modules/vif/jobs/xo-vif-disconnect.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useVifConnection(options: { vifs: MaybeRefOrGetter<FrontXoVif[]>; vm: MaybeRefOrGetter<FrontXoVm> }) {
  const vifs = toComputed(options.vifs)
  const vm = toComputed(options.vm)

  const {
    run: runConnect,
    canRun: canConnectVifs,
    isRunning: isConnectingVifs,
    errorMessage: connectVifsErrorMessage,
  } = useXoVifConnectJob(vifs, vm)

  const {
    run: runDisconnect,
    canRun: canDisconnectVifs,
    isRunning: isDisconnectingVifs,
    errorMessage: disconnectVifsErrorMessage,
  } = useXoVifDisconnectJob(vifs, vm)

  const { open } = useOverlay({
    component: () => import('@core/components/vif-connection-modal/VtsVifConnectionModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  function connectVifs() {
    return open({
      props: {
        action: CONNECTION_ACTION.CONNECT,
        count: vifs.value.length,
      },
      events: {
        onConfirm: async () => {
          try {
            await runConnect()
          } catch (error) {
            console.error('Error when connecting VIF:', error)
          }
        },
      },
    })
  }

  function disconnectVifs() {
    return open({
      props: {
        action: CONNECTION_ACTION.DISCONNECT,
        count: vifs.value.length,
      },
      events: {
        onConfirm: async () => {
          try {
            await runDisconnect()
          } catch (error) {
            console.error('Error when disconnecting VIF:', error)
          }
        },
      },
    })
  }

  return {
    connectVifs,
    disconnectVifs,
    canConnectVifs,
    canDisconnectVifs,
    isConnectingVifs,
    isDisconnectingVifs,
    connectVifsErrorMessage,
    disconnectVifsErrorMessage,
  }
}
