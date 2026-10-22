import { useVdfScope, type VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import { useVdfGlobalPublishJob, useVdfPublishJob } from '@/modules/vdf/jobs/vdf-publish.job.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { reactiveComputed } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function useVdfPublish(rawScope: MaybeRefOrGetter<VdfScope>) {
  const scope = useVdfScope(rawScope)

  const { scopeId, document, changes } = scope

  const publishError = ref<string>()

  const poolJob = useVdfPublishJob(scopeId, document)

  const globalJob = useVdfGlobalPublishJob(scopeId, document, () => (scope.isGlobal ? scope.revision.value : 0))

  const isPublishing = computed(() => (scope.isGlobal ? globalJob.isRunning.value : poolJob.isRunning.value))

  async function publish() {
    if (scope.isGlobal) {
      const result = await globalJob.run()

      scope.recordPublish(result.revision ?? scope.revision.value + 1)
    } else {
      const result = await poolJob.run()

      scope.recordPublish(result.document ?? '')
    }
  }

  const { open } = useOverlay({
    component: () => import('@/modules/vdf/components/VdfPublishModal.vue'),
    events: {
      onConfirm: async () => {
        publishError.value = undefined

        try {
          await publish()
        } catch (error) {
          publishError.value = (error as Error).message

          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    scopeId: scopeId.value,
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
