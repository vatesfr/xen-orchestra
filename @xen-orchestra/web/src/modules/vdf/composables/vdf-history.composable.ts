import { useVdfScope, type VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import { fetchVdfHistoryVersion, useVdfHistory } from '@/modules/vdf/remote-resources/use-vdf-history.ts'
import type { VdfDocument, VdfGlobalDocument, VdfHistoryEntry, VdfHistoryVersion } from '@/modules/vdf/types.ts'
import { vdfPageRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useRouter } from 'vue-router'

// A scope's publish history: each version's changes, and "Restore as
// draft", which makes a version the draft, to review and publish like any
// edit (nothing is published from here).
export function useVdfHistoryPage(rawScope: MaybeRefOrGetter<VdfScope>) {
  const scope = useVdfScope(rawScope)

  const router = useRouter()

  const { history, isHistoryReady, hasHistoryError, reloadHistory } = useVdfHistory({}, scope.scopeId)

  // newest first
  const entries = computed(() => [...(history.value?.entries ?? [])].reverse())

  // the version the scope enforces now: the newest one with its id
  const currentId = computed(
    () =>
      entries.value.find(entry =>
        scope.isGlobal ? entry.revision === scope.revision.value : entry.docId === scope.publishedDocId.value
      )?.id
  )

  // a global version is edited with its scope
  function draftOf(version: VdfHistoryVersion): VdfDocument {
    return scope.isGlobal
      ? ({ ...version.document, scope: version.scope ?? { all: true } } satisfies VdfGlobalDocument)
      : version.document
  }

  const { open: openRestoreModal } = useOverlay({
    component: () => import('@/modules/vdf/components/history/VdfRestoreVersionModal.vue'),
    events: { onConfirm: true, onCancel: true },
  })

  async function restoreVersion(version: VdfHistoryVersion) {
    const response = await openRestoreModal({
      props: { publishedAt: version.publishedAt, draftChangeCount: scope.changes.value.length },
    })

    if (response.event !== 'onConfirm') {
      return
    }

    scope.replaceDraft(draftOf(version))
    await router.push(vdfPageRoute(scope.scopeId.value, 'policies'))
  }

  const { open: openVersionModal } = useOverlay({
    component: () => import('@/modules/vdf/components/history/VdfHistoryVersionModal.vue'),
    events: {
      onCancel: true,
      onRestore: (version: VdfHistoryVersion) => version,
    },
  })

  async function viewVersion(entry: VdfHistoryEntry) {
    const response = await openVersionModal({
      props: { scopeId: scope.scopeId.value, entry, isCurrent: entry.id === currentId.value },
    })

    if (response.event === 'onRestore') {
      await restoreVersion(response.payload)
    }
  }

  async function restoreEntry(entry: VdfHistoryEntry) {
    let version: VdfHistoryVersion

    try {
      version = await fetchVdfHistoryVersion(scope.scopeId.value, entry.id)
    } catch {
      // the version modal shows why it can't be read
      return viewVersion(entry)
    }

    return restoreVersion(version)
  }

  return {
    entries,
    currentId,
    isHistoryReady,
    hasHistoryError,
    reloadHistory,
    viewVersion,
    restoreEntry,
  }
}
