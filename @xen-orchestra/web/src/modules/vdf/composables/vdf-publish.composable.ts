import { useVdfScope, type VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import { useVdfGlobalPublishJob, useVdfPublishJob } from '@/modules/vdf/jobs/vdf-publish.job.ts'
import { changeDetails, isMonitorOnlyChange } from '@/modules/vdf/utils/vdf-change.util.ts'
import type { VdfResolution } from '@/modules/vdf/utils/vdf-merge.util.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { reactiveComputed } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

// The draft's actions: review and publish, rebase onto what was published
// since, discard. Each opens its own modal.
export function useVdfPublish(rawScope: MaybeRefOrGetter<VdfScope>) {
  const scope = useVdfScope(rawScope)

  const { scopeId, document, changes, expectedDocId } = scope

  const publishError = ref<string>()

  const poolJob = useVdfPublishJob(scopeId, document, expectedDocId)

  // the global configuration's document ids are `r<revision>`
  const baseRevision = computed(() => Number(expectedDocId.value.replace(/^r/, '')) || 0)

  const globalJob = useVdfGlobalPublishJob(scopeId, document, baseRevision)

  const isPublishing = computed(() => (scope.isGlobal ? globalJob.isRunning.value : poolJob.isRunning.value))

  async function publish() {
    // what the banner says once published: nothing is cut when only
    // policies in monitor mode change
    const monitorOnly = isMonitorOnlyChange(scope.publishedDocument.value, document.value)

    if (scope.isGlobal) {
      const result = await globalJob.run()

      scope.recordPublish(result.revision ?? scope.revision.value + 1, monitorOnly)
    } else {
      const result = await poolJob.run()

      scope.recordPublish(result.document ?? '', monitorOnly)
    }
  }

  function reloadPublished() {
    if (scope.isGlobal) {
      scope.reloadGlobal()
    } else {
      scope.reloadPublishedPolicy()
    }
  }

  // members a policy would protect, for the review's warnings
  const memberCounts = computed(() => {
    if (!scope.areVmsReady.value) {
      return undefined
    }

    return Object.fromEntries(Object.keys(document.value.groups).map(name => [name, scope.membersOf(name).length]))
  })

  // REVIEW AND PUBLISH

  const { open: openPublishModal } = useOverlay({
    component: () => import('@/modules/vdf/components/VdfPublishModal.vue'),
    events: {
      onConfirm: async () => {
        // published since the draft started: rebase first, or their
        // changes would be undone
        if (scope.isDraftOutdated.value) {
          return KEEP_OVERLAY_OPEN
        }

        publishError.value = undefined

        try {
          await publish()
        } catch (error) {
          publishError.value = (error as Error).message
          // a refused compare-and-swap: the draft shows as outdated
          reloadPublished()

          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
      onRebase: true,
    },
  })

  const publishProps = reactiveComputed(() => ({
    scopeId: scopeId.value,
    document: document.value,
    baseDocument: scope.baseDocument.value,
    changeCount: changes.value.length,
    isOutdated: scope.isDraftOutdated.value,
    memberCounts: memberCounts.value,
    publishError: publishError.value,
  }))

  async function openPublish() {
    publishError.value = undefined

    const response = await openPublishModal({ props: publishProps })

    if (response.event === 'onRebase') {
      await openRebase()
    }
  }

  // REBASE

  const { open: openRebaseModal } = useOverlay({
    component: () => import('@/modules/vdf/components/draft/VdfRebaseModal.vue'),
    events: {
      onConfirm: (resolutions: Record<string, VdfResolution>) => {
        scope.rebaseDraft(resolutions)
      },
      onCancel: true,
    },
  })

  const rebaseProps = reactiveComputed(() => ({
    scopeId: scopeId.value,
    upstream: changeDetails(scope.baseDocument.value, scope.publishedDocument.value),
    conflicts: scope.rebaseConflicts.value,
    renumbered: scope.isDraftOutdated.value ? scope.rebasePreview().renumbered : [],
    changeCount: changes.value.length,
    hasBase: scope.draft.value?.baseDocument !== undefined,
  }))

  function openRebase() {
    return openRebaseModal({ props: rebaseProps })
  }

  // DISCARD

  const { open: openDiscardModal } = useOverlay({
    component: () => import('@/modules/vdf/components/draft/VdfDiscardDraftModal.vue'),
    events: {
      onConfirm: () => {
        scope.discardDraft()
      },
      onCancel: true,
    },
  })

  const discardProps = reactiveComputed(() => ({ changeCount: changes.value.length }))

  function openDiscard() {
    return openDiscardModal({ props: discardProps })
  }

  return { openPublish, openRebase, openDiscard, isPublishing }
}
