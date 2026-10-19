import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'

export function createNetwork(overrides: Partial<FrontXoNetwork> = {}): FrontXoNetwork {
  return {
    id: 'network-123' as FrontXoNetwork['id'],
    name_label: 'Pool-wide network',
    name_description: '',
    $pool: 'pool-789' as FrontXoNetwork['$pool'],
    defaultIsLocked: false,
    nbd: false,
    tags: [],
    MTU: 1500,
    PIFs: [],
    other_config: {},
    type: 'network',
    isBonded: false,
    ...overrides,
  }
}
