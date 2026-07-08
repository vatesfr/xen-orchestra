import { useXoPbdUnplugJob } from '@/modules/pbd/jobs/xo-pbd-unplug.job.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { getSrAccessMode } from '@core/utils/sr.utils.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useSrDisconnectModal(rawSrs: MaybeRefOrGetter<FrontXoSr[]>, rawScope: MaybeRefOrGetter<SrScope>) {
  const srs = toComputed(rawSrs)
  const scope = toComputed(rawScope)

  const { getAttachedPbdsInScope } = useGetPbdsInScope()

  const unplugTargets = computed(() => srs.value.flatMap(sr => getAttachedPbdsInScope(sr, scope.value)))

  const targetCount = computed(() => unplugTargets.value.length)

  const { run, canRun, isRunning, errorMessage } = useXoPbdUnplugJob(unplugTargets)

  const { open } = useOverlay({
    component: () => import('@/modules/storage-repository/components/modal/SrDisconnectModal.vue'),
    events: {
      onConfirm: async () => {
        try {
          await run()
        } catch (error) {
          console.error(`Error when disconnecting SR:`, error)
        }
      },
      onCancel: true,
    },
  })

  function openModal() {
    return open({
      props: {
        count: srs.value.length,
        scope: scope.value,
        accessMode: getSrAccessMode(srs.value),
        hostsCount: targetCount.value,
      },
    })
  }

  return { openModal, canRun, isRunning, errorMessage, targetCount }
}
