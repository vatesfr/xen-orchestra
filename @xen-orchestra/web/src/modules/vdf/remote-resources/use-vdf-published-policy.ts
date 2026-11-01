import type { VdfPublishedPolicy } from '@/modules/vdf/types.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

// The pool's keys are watched through the pool collection (vdf-policy
// composable): this resource is reloaded when they change.
export const useVdfPublishedPolicy = defineRemoteResource({
  url: (poolId: string) => `${BASE_URL}/plugins/vdf/pools/${poolId}/policy`,
  pollingIntervalMs: 60_000,
  // each answer is the whole document: replace it (the default deep merge
  // would keep what the server removed, and skip reactivity)
  onDataReceived: async (data: Ref<VdfPublishedPolicy | undefined>, receivedData: VdfPublishedPolicy) => {
    data.value = receivedData
  },
  state: (publishedPolicy: Ref<VdfPublishedPolicy | undefined>, context) => ({
    publishedPolicy,
    isPublishedPolicyReady: context.isReady,
    hasPublishedPolicyError: context.hasError,
    reloadPublishedPolicy: context.forceReload,
  }),
})
