import type { XoBrowserMedia } from '@/modules/browser-media/types/xo-browser-media.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed } from 'vue'

export const useXoBrowserMediaCollection = defineRemoteResource({
  url: `${BASE_URL}/browser-media`,
  initialData: () => [] as XoBrowserMedia[],
  // only fetched to know whether the feature is available: this tab drives its own sessions
  pollingIntervalMs: false,
  state: (browserMedias, context) => ({
    browserMedias,
    // xo-server only exposes it to administrators, and when `iscsi.advertisedAddress` is set
    isBrowserMediaAvailable: computed(() => context.isReady.value && !context.hasError.value),
  }),
})
