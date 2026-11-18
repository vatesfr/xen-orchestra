import type {
  FrontXoProxy,
  useXoProxyCollection as realUseXoProxyCollection,
} from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { createMockCollection } from '@/test/find-by-id.ts'
import { ref } from 'vue'

// Shared state of the mocked proxy collection: a test sets the proxies it needs, reset it in `beforeEach`
export const proxyCollectionMock = {
  proxies: ref<FrontXoProxy[]>([]),
  reset() {
    this.proxies.value = []
  },
}

// Use as `mockModule(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => import('@/test/mock-xo-proxy-collection.ts'))`
export const useXoProxyCollection = (() => ({
  ...createMockCollection('Proxy', 'Proxies', proxyCollectionMock.proxies),
})) as unknown as typeof realUseXoProxyCollection
