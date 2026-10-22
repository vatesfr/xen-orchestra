import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfPublishJob } from '@/modules/vdf/jobs/vdf-publish.job.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVdfPublish(rawPool: MaybeRefOrGetter<FrontXoPool>) {
  const pool = toComputed(rawPool)

  const { poolId, document, changes, recordPublish } = useVdfPolicy(pool)

  const publishError = ref<string>()

  const { run, isRunning: isPublishing } = useVdfPublishJob(poolId, document)

  const { open } = useOverlay({
    component: () => import('@/modules/vdf/components/VdfPublishModal.vue'),
    events: {
      onConfirm: async () => {
        publishError.value = undefined

        try {
          const result = await run()

          recordPublish(result.document ?? '')
        } catch (error) {
          publishError.value = (error as Error).message

          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    poolId: poolId.value,
    document: document.value,
    changes: changes.value,
    publishError: publishError.value,
  }))

  function openPublish() {
    publishError.value = undefined

    return open({ props })
  }

  return { openPublish, isPublishing }
}
