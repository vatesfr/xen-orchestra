import type { XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVifConnectJob } from '@/modules/vif/jobs/vif-connect.job.ts'
import { useVifDisconnectJob } from '@/modules/vif/jobs/vif-disconnect.job.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useVifConnection(options: { vifs: MaybeRefOrGetter<XenApiVif[]>; vm: MaybeRefOrGetter<XenApiVm> }) {
  const vifs = toComputed(options.vifs)
  const vm = toComputed(options.vm)

  const {
    run: runConnect,
    canRun: canConnectVifs,
    isRunning: isConnectingVifs,
    errorMessage: connectVifsErrorMessage,
  } = useVifConnectJob(vifs, vm)

  const {
    run: runDisconnect,
    canRun: canDisconnectVifs,
    isRunning: isDisconnectingVifs,
    errorMessage: disconnectVifsErrorMessage,
  } = useVifDisconnectJob(vifs, vm)

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
