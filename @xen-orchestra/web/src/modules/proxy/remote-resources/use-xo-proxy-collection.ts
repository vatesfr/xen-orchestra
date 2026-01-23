import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoProxy } from '@vates/types'

const proxyFields = ['id', 'name'] as const satisfies readonly (keyof XoProxy)[]

export const useXoProxyCollection = defineRemoteResource({
  url: `${BASE_URL}/proxies?fields=${proxyFields.join(',')}`,
  initialData: () => [] as Pick<XoProxy, (typeof proxyFields)[number]>[],
  state: (proxies, context) =>
    useXoCollectionState(proxies, {
      context,
      baseName: ['proxy', 'proxies'],
    }),
})
