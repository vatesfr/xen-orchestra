import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'

/**
 * Builds a fully-populated `FrontXoProxy` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createProxy(overrides: Partial<FrontXoProxy> = {}): FrontXoProxy {
  return {
    id: 'proxy-1' as FrontXoProxy['id'],
    name: 'Proxy 1',
    ...overrides,
  }
}
