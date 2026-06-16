import { usePbdPlugJob } from '@/jobs/pbd-plug.job'
import type { XenApiSr } from '@/libs/xen-api/xen-api.types'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/sr-utils.composable'
import type { SrScope } from '@/modules/storage-repository/types/storage-repository.type'
import { getSrAccessMode } from '@/modules/storage-repository/utils/sr.util'
import { useModal } from '@core/packages/modal/use-modal'
import { toComputed } from '@core/utils/to-computed.util'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useSrConnectModal(rawSrs: MaybeRefOrGetter<XenApiSr[]>, rawScope: MaybeRefOrGetter<SrScope>) {
  const srs = toComputed(rawSrs)
  const scope = toComputed(rawScope)

  const { getDetachedPbdsInScope } = useGetPbdsInScope()

  const plugTargets = computed(() => srs.value.flatMap(sr => getDetachedPbdsInScope(sr, scope.value)))
  const targetCount = computed(() => plugTargets.value.length)

  const { run, canRun, isRunning, errorMessage } = usePbdPlugJob(plugTargets)

  const openModal = useModal(() => ({
    component: import('@/modules/storage-repository/components/modal/SrConnectModal.vue'),
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
        console.error(`Error when connecting SR:`, error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage, targetCount }
}
