import type { VdfRuleLogEntry } from '@/modules/vdf/types.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

export const useVdfRuleLog = defineRemoteResource({
  url: (poolId: string) => `${BASE_URL}/plugins/vdf/pools/${poolId}/rule-log?lines=500`,
  pollingIntervalMs: 5000,
  cacheExpirationMs: false,
  // each answer is the whole document: replace it (the default deep merge
  // would keep what the server removed, and skip reactivity)
  onDataReceived: async (
    data: Ref<{ entries: VdfRuleLogEntry[]; errors: { hostName: string; error: string }[] } | undefined>,
    receivedData: { entries: VdfRuleLogEntry[]; errors: { hostName: string; error: string }[] }
  ) => {
    data.value = receivedData
  },
  state: (
    ruleLog: Ref<{ entries: VdfRuleLogEntry[]; errors: { hostName: string; error: string }[] } | undefined>,
    context
  ) => ({
    ruleLog,
    isRuleLogReady: context.isReady,
    hasRuleLogError: context.hasError,
  }),
})
