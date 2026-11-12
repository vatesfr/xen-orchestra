import type { VdfHistoryEntry, VdfHistoryVersion, VdfScopeId, VdfTagChange } from '@/modules/vdf/types.ts'
import { isGlobalScope } from '@/modules/vdf/utils/vdf-global.util.ts'
import { BASE_URL, fetchGet } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

const historyPath = (scopeId: VdfScopeId) =>
  isGlobalScope(scopeId) ? 'plugins/vdf/global/history' : `plugins/vdf/pools/${scopeId}/history`

// The last documents XO published in a scope, oldest first, without their
// content (xo-server-vdf history.mjs); a pool's also has the vdf: tags
// changed outside XO on its VMs and networks, oldest first (absent from
// older plugins)
type VdfHistory = { entries: VdfHistoryEntry[]; tagChanges?: VdfTagChange[] }

export const useVdfHistory = defineRemoteResource({
  url: (scopeId: VdfScopeId) => `${BASE_URL}/${historyPath(scopeId)}`,
  pollingIntervalMs: 30_000,
  // each answer is the whole list: replace it (the default deep merge
  // would keep what the server removed, and skip reactivity)
  onDataReceived: async (data: Ref<VdfHistory | undefined>, receivedData: VdfHistory) => {
    data.value = receivedData
  },
  state: (history: Ref<VdfHistory | undefined>, context) => ({
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
