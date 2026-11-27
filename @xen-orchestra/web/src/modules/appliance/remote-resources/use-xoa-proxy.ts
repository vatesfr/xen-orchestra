import type { XoaProxy } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed } from 'vue'

export const useXoaProxy = defineRemoteResource({
  url: `${BASE_URL}/plugins/xoa/proxy`,
  cacheExpirationMs: false,
  pollingIntervalMs: false,
  initialData: () => undefined as { proxy?: XoaProxy } | undefined,
  state: (data, context) => {
    const proxy = computed(() => data.value?.proxy)

    return {
      proxy,
      isProxyReady: context.isReady,
      reloadProxy: context.forceReload,
    }
  },
})
