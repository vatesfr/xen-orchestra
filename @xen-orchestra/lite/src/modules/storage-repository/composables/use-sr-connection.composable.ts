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

  const plugTargets = computed(() => srs.value.flatMap(sr => getDetachedPbdsInScope(sr, scope.value)))
  const unplugTargets = computed(() => srs.value.flatMap(sr => getAttachedPbdsInScope(sr, scope.value)))

  const connectTargetCount = computed(() => plugTargets.value.length)
  const disconnectTargetCount = computed(() => unplugTargets.value.length)

  const {
    run: plugSrs,
    canRun: canConnectSr,
    isRunning: isConnectingSr,
    errorMessage: connectSrErrorMessage,
  } = usePbdPlugJob(plugTargets)

  const {
    run: unplugSrs,
    canRun: canDisconnectSr,
    isRunning: isDisconnectingSr,
    errorMessage: disconnectSrErrorMessage,
  } = usePbdUnplugJob(unplugTargets)

  const { open } = useOverlay({
    component: () => import('@core/components/sr-connection-modal/VtsSrConnectionModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  function connectSr() {
    return open({
      props: {
        action: CONNECTION_ACTION.CONNECT,
        count: srs.value.length,
        scope: scope.value,
        accessMode: getSrAccessMode(srs.value),
        hostsCount: connectTargetCount.value,
      },
      events: {
        onConfirm: async () => {
          try {
            await plugSrs()
          } catch (error) {
            console.error('Error when connecting SR:', error)
          }
        },
      },
    })
  }

  function disconnectSr() {
    return open({
      props: {
        action: CONNECTION_ACTION.DISCONNECT,
        count: srs.value.length,
        scope: scope.value,
        accessMode: getSrAccessMode(srs.value),
        hostsCount: disconnectTargetCount.value,
      },
      events: {
        onConfirm: async () => {
          try {
            await unplugSrs()
          } catch (error) {
            console.error('Error when disconnecting SR:', error)
          }
        },
      },
    })
  }

  return {
    connectSr,
    disconnectSr,
    canConnectSr,
    canDisconnectSr,
    isConnectingSr,
    isDisconnectingSr,
    connectSrErrorMessage,
    disconnectSrErrorMessage,
    connectTargetCount,
    disconnectTargetCount,
  }
}
