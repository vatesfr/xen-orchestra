import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoProxy } from '@vates/types'

export const useXoProxyCollection = defineRemoteResource({
  url: '/rest/v0/proxies?fields=id,name',
  initialData: () => [] as XoProxy[],
  state: (proxies, context) =>
    useXoCollectionState(proxies, {
      context,
      baseName: ['proxy', 'proxies'],
    }),
})
