import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'

/**
 * Builds a fully-populated `FrontXoNetwork` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createNetwork(overrides: Partial<FrontXoNetwork> = {}): FrontXoNetwork {
  return {
    id: 'network-123' as FrontXoNetwork['id'],
    name_label: 'Test network',
    name_description: 'A test network',
    defaultIsLocked: false,
    nbd: false,
    tags: [],
    $pool: 'pool-789' as FrontXoNetwork['$pool'],
    MTU: 1500,
    PIFs: [],
    other_config: {},
    type: 'network',
    isBonded: false,
    ...overrides,
  }
}
