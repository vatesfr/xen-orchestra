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
    run: connectVifs,
    canRun: canConnectVif,
    isRunning: isConnectingVif,
    errorMessage: connectVifErrorMessage,
  } = useVifConnectJob(vifs, vm)

  const {
    run: disconnectVifs,
    canRun: canDisconnectVif,
    isRunning: isDisconnectingVif,
    errorMessage: disconnectVifErrorMessage,
  } = useVifDisconnectJob(vifs, vm)

  const { open } = useOverlay({
    component: () => import('@core/components/vif-connection-modal/VtsVifConnectionModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  function connectVif() {
    return open({
      props: {
        action: CONNECTION_ACTION.CONNECT,
        count: vifs.value.length,
      },
      events: {
        onConfirm: async () => {
          try {
            await connectVifs()
          } catch (error) {
            console.error('Error when connecting VIF:', error)
          }
        },
      },
    })
  }

  function disconnectVif() {
    return open({
      props: {
        action: CONNECTION_ACTION.DISCONNECT,
        count: vifs.value.length,
      },
      events: {
        onConfirm: async () => {
          try {
            await disconnectVifs()
          } catch (error) {
            console.error('Error when disconnecting VIF:', error)
          }
        },
      },
    })
  }

  return {
    connectVif,
    disconnectVif,
    canConnectVif,
    canDisconnectVif,
    isConnectingVif,
    isDisconnectingVif,
    connectVifErrorMessage,
    disconnectVifErrorMessage,
  }
}
