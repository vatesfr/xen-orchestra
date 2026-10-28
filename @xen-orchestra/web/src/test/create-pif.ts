import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'

/**
 * Builds a fully-populated `FrontXoPif` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createPif(overrides: Partial<FrontXoPif> = {}): FrontXoPif {
  return {
    id: 'pif-123' as FrontXoPif['id'],
    $host: 'host-456' as FrontXoPif['$host'],
    $network: 'network-123' as FrontXoPif['$network'],
    $pool: 'pool-789' as FrontXoPif['$pool'],
    attached: true,
    carrier: true,
    device: 'eth0',
    dns: '',
    gateway: '',
    ip: '',
    ipv6: [],
    mac: '00:00:00:00:00:00',
    management: false,
    mode: 'Static',
    mtu: 1500,
    netmask: '',
    speed: 1000,
    vlan: -1,
    isBondMaster: false,
    isBondSlave: false,
    bondSlaves: undefined,
    physical: true,
    type: 'PIF',
    ipv6Mode: 'None',
    primaryAddressType: 'IPv4',
    ...overrides,
  }
}
