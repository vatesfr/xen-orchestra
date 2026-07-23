import { usePbdUnplugJob } from '@/jobs/pbd-unplug.job.ts'
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/sr-utils.composable.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { getSrAccessMode } from '@core/utils/sr.utils.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useSrDisconnectModal(rawSrs: MaybeRefOrGetter<XenApiSr[]>, rawScope: MaybeRefOrGetter<SrScope>) {
  const srs = toComputed(rawSrs)
  const scope = toComputed(rawScope)

  const { getAttachedPbdsInScope } = useGetPbdsInScope()

  const unplugTargets = computed(() => srs.value.flatMap(sr => getAttachedPbdsInScope(sr, scope.value)))

  const targetCount = computed(() => unplugTargets.value.length)

  const { run, canRun, isRunning, errorMessage } = usePbdUnplugJob(unplugTargets)

  const openModal = useModal(() => ({
    component: import('@/modules/storage-repository/components/modal/SrConnectionToggleModal.vue'),
    props: {
      action: CONNECTION_ACTION.DISCONNECT,
      count: srs.value.length,
      scope: scope.value,
      accessMode: getSrAccessMode(srs.value),
      hostsCount: targetCount.value,
    },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error(`Error when disconnecting SR:`, error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage, targetCount }
}
