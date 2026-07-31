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
    run: connectVifs,
    canRun: canConnectVif,
    isRunning: isConnectingVif,
    errorMessage: connectVifErrorMessage,
  } = useXoVifConnectJob(vifs, vm)

  const {
    run: disconnectVifs,
    canRun: canDisconnectVif,
    isRunning: isDisconnectingVif,
    errorMessage: disconnectVifErrorMessage,
  } = useXoVifDisconnectJob(vifs, vm)

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
