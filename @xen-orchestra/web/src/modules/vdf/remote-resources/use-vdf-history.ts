import type { VdfHistoryEntry, VdfHistoryVersion, VdfScopeId } from '@/modules/vdf/types.ts'
import { isGlobalScope } from '@/modules/vdf/utils/vdf-global.util.ts'
import { BASE_URL, fetchGet } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

const historyPath = (scopeId: VdfScopeId) =>
  isGlobalScope(scopeId) ? 'plugins/vdf/global/history' : `plugins/vdf/pools/${scopeId}/history`

// The last documents XO published in a scope, oldest first, without their
// content (xo-server-vdf history.mjs)
export const useVdfHistory = defineRemoteResource({
  url: (scopeId: VdfScopeId) => `${BASE_URL}/${historyPath(scopeId)}`,
  pollingIntervalMs: 30_000,
  // each answer is the whole list: replace it (the default deep merge
  // would keep what the server removed, and skip reactivity)
  onDataReceived: async (
    data: Ref<{ entries: VdfHistoryEntry[] } | undefined>,
    receivedData: { entries: VdfHistoryEntry[] }
  ) => {
    data.value = receivedData
  },
  state: (history: Ref<{ entries: VdfHistoryEntry[] } | undefined>, context) => ({
    history,
    isHistoryReady: context.isReady,
    hasHistoryError: context.hasError,
    reloadHistory: context.forceReload,
  }),
})

// one version with its document, and the one it replaced
export function fetchVdfHistoryVersion(scopeId: VdfScopeId, id: number) {
  return fetchGet<VdfHistoryVersion>(`${historyPath(scopeId)}/${id}`)
}
