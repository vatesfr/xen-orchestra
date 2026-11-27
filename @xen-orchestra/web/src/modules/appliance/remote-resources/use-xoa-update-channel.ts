import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed } from 'vue'

export const useXoaUpdateChannel = defineRemoteResource({
  url: `${BASE_URL}/plugins/xoa/updates/channel`,
  cacheExpirationMs: false,
  pollingIntervalMs: false,
  initialData: () => undefined as { channel?: string } | undefined,
  state: (data, context) => {
    const channel = computed(() => data.value?.channel)

    return {
      channel,
      isChannelReady: context.isReady,
      reloadChannel: context.forceReload,
    }
  },
})
