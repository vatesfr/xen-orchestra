import { useXoPbdPlugJob } from '@/modules/pbd/jobs/xo-pbd-plug.job.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { getSrAccessMode } from '@core/utils/sr.utils.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useSrConnectModal(rawSrs: MaybeRefOrGetter<FrontXoSr[]>, rawScope: MaybeRefOrGetter<SrScope>) {
  const srs = toComputed(rawSrs)
  const scope = toComputed(rawScope)

  const { getDetachedPbdsInScope } = useGetPbdsInScope()

  const plugTargets = computed(() => srs.value.flatMap(sr => getDetachedPbdsInScope(sr, scope.value)))
  const targetCount = computed(() => plugTargets.value.length)

  const { run, canRun, isRunning, errorMessage } = useXoPbdPlugJob(plugTargets)

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
