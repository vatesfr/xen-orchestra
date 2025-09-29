import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoProxy } from '@/types/xo/proxy.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoProxyCollection = defineRemoteResource({
  url: '/rest/v0/proxies?fields=id,name',
  initialData: () => [] as XoProxy[],
  state: (proxies, context) =>
    useXoCollectionState(proxies, {
      context,
      baseName: ['proxy', 'proxies'],
    }),
})
