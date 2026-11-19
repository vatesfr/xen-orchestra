import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'

/**
 * Builds a fully-populated `FrontXoVif` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createVif(overrides: Partial<FrontXoVif> = {}): FrontXoVif {
  return {
    id: 'vif-123' as FrontXoVif['id'],
    $VM: 'vm-123' as FrontXoVif['$VM'],
    $network: 'network-123' as FrontXoVif['$network'],
    $pool: 'pool-789' as FrontXoVif['$pool'],
    attached: true,
    device: '0',
    txChecksumming: true,
    lockingMode: 'network_default',
    MAC: '00:00:00:00:00:00',
    MTU: 1500,
    rateLimit: undefined,
    type: 'VIF',
    other_config: {},
    ...overrides,
  }
}
