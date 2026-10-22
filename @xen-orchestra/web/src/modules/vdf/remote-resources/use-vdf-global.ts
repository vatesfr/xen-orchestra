import type { VdfGlobalStatus } from '@/modules/vdf/types.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

// XO-wide configuration and each pool's sync state: polled, since a sync
// follows events XO handles server-side (a member started elsewhere, a pool
// back online)
export const useVdfGlobal = defineRemoteResource({
  url: `${BASE_URL}/plugins/vdf/global`,
  pollingIntervalMs: 10_000,
  // each answer is the whole document: replace it (the default deep merge
  // would keep what the server removed, and skip reactivity)
  onDataReceived: async (data: Ref<VdfGlobalStatus | undefined>, receivedData: VdfGlobalStatus) => {
    data.value = receivedData
  },
  state: (globalStatus: Ref<VdfGlobalStatus | undefined>, context) => ({
    globalStatus,
    isGlobalReady: context.isReady,
    hasGlobalError: context.hasError,
    reloadGlobal: context.forceReload,
  }),
})
