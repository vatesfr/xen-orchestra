import { usePbdPlugJob } from '@/jobs/pbd-plug.job.ts'
import { usePbdUnplugJob } from '@/jobs/pbd-unplug.job.ts'
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/sr-utils.composable.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { getSrAccessMode } from '@core/utils/sr.utils.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useSrConnection(options: { srs: MaybeRefOrGetter<XenApiSr[]>; scope: MaybeRefOrGetter<SrScope> }) {
  const srs = toComputed(options.srs)
  const scope = toComputed(options.scope)

  const { getAttachedPbdsInScope, getDetachedPbdsInScope } = useGetPbdsInScope()

  const connectionTargets = computed(() => srs.value.flatMap(sr => getDetachedPbdsInScope(sr, scope.value)))
  const disconnectionTargets = computed(() => srs.value.flatMap(sr => getAttachedPbdsInScope(sr, scope.value)))

  const connectionTargetCount = computed(() => connectionTargets.value.length)
  const disconnectionTargetCount = computed(() => disconnectionTargets.value.length)

  const {
    run: runConnect,
    canRun: canConnectSrs,
    isRunning: isConnectingSrs,
    errorMessage: connectSrsErrorMessage,
  } = usePbdPlugJob(connectionTargets)

  const {
    run: runDisconnect,
    canRun: canDisconnectSrs,
    isRunning: isDisconnectingSrs,
    errorMessage: disconnectSrsErrorMessage,
  } = usePbdUnplugJob(disconnectionTargets)

  const { open } = useOverlay({
    component: () => import('@core/components/sr-connection-modal/VtsSrConnectionModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  function connectSrs() {
    return open({
      props: {
        action: CONNECTION_ACTION.CONNECT,
        count: srs.value.length,
        scope: scope.value,
        accessMode: getSrAccessMode(srs.value),
        hostsCount: connectionTargetCount.value,
      },
      events: {
        onConfirm: async () => {
          try {
            await runConnect()
          } catch (error) {
            console.error('Error when connecting SR:', error)
          }
        },
      },
    })
  }

  function disconnectSrs() {
    return open({
      props: {
        action: CONNECTION_ACTION.DISCONNECT,
        count: srs.value.length,
        scope: scope.value,
        accessMode: getSrAccessMode(srs.value),
        hostsCount: disconnectionTargetCount.value,
      },
      events: {
        onConfirm: async () => {
          try {
            await runDisconnect()
          } catch (error) {
            console.error('Error when disconnecting SR:', error)
          }
        },
      },
    })
  }

  return {
    connectSrs,
    disconnectSrs,
    canConnectSrs,
    canDisconnectSrs,
    isConnectingSrs,
    isDisconnectingSrs,
    connectSrsErrorMessage,
    disconnectSrsErrorMessage,
    connectionTargetCount,
    disconnectionTargetCount,
  }
}
