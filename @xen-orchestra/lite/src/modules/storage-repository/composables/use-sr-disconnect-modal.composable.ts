import { usePbdUnplugJob } from '@/jobs/pbd-unplug.job'
import type { XenApiSr } from '@/libs/xen-api/xen-api.types'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/sr-utils.composable'
import type { SrScope } from '@/modules/storage-repository/types/storage-repository.type'
import { getSrAccessMode } from '@/modules/storage-repository/utils/sr.util'
import { useModal } from '@core/packages/modal/use-modal'
import { toComputed } from '@core/utils/to-computed.util'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useSrDisconnectModal(rawSrs: MaybeRefOrGetter<XenApiSr[]>, rawScope: MaybeRefOrGetter<SrScope>) {
  const srs = toComputed(rawSrs)
  const scope = toComputed(rawScope)

  const { getAttachedPbdsInScope } = useGetPbdsInScope()

  const unplugTargets = computed(() => srs.value.flatMap(sr => getAttachedPbdsInScope(sr, scope.value)))

  const targetCount = computed(() => unplugTargets.value.length)

  const { run, canRun, isRunning, errorMessage } = usePbdUnplugJob(unplugTargets)

  const openModal = useModal(() => ({
    component: import('@/modules/storage-repository/components/modal/SrDisconnectModal.vue'),
    props: {
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
