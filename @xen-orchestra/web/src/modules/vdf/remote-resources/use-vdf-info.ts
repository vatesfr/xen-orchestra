import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

// Answers while the vdf plugin is loaded (tech preview, opt-in): polled
// slowly, so that unloading the plugin hides the firewall interface
export const useVdfInfo = defineRemoteResource({
  url: `${BASE_URL}/plugins/vdf/info`,
  pollingIntervalMs: 60_000,
  state: (info: Ref<{ techPreview?: boolean } | undefined>, context) => ({
    info,
    isVdfInfoReady: context.isReady,
    hasVdfInfoError: context.hasError,
  }),
})
