import { useXoPbdUnplugJob } from '@/modules/pbd/jobs/xo-pbd-unplug.job.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { StorageScope } from '@/modules/storage-repository/types/storage-scope.type.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useSrDisconnectModal(rawSrs: MaybeRefOrGetter<FrontXoSr[]>, rawScope: MaybeRefOrGetter<StorageScope>) {
  const srs = toComputed(rawSrs)
  const scope = toComputed(rawScope)

  const { getAttachedPbdsInScope } = useGetPbdsInScope()

  const unplugTargets = computed(() => srs.value.flatMap(sr => getAttachedPbdsInScope(sr, scope.value)))

  const targetCount = computed(() => unplugTargets.value.length)

  const { run, canRun, isRunning, errorMessage } = useXoPbdUnplugJob(unplugTargets)

  const openModal = useModal(() => ({
    component: import('@/modules/storage-repository/components/modal/SrDisconnectModal.vue'),
    props: { count: srs.value.length, scope: scope.value },
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
