import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { IP_CONFIGURATION_MODE, IPV6_CONFIGURATION_MODE, PRIMARY_ADDRESS_TYPE } from '@vates/types'

/**
 * Builds a fully-populated `FrontXoPif` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createPif(overrides: Partial<FrontXoPif> = {}): FrontXoPif {
  return {
    id: 'pif-123' as FrontXoPif['id'],
    type: 'PIF',
    $host: 'host-456' as FrontXoPif['$host'],
    $network: 'network-123' as FrontXoPif['$network'],
    $pool: 'pool-789' as FrontXoPif['$pool'],
    attached: true,
    carrier: true,
    device: 'eth0',
    dns: '8.8.8.8',
    gateway: '192.168.1.1',
    ip: '192.168.1.10',
    ipv6: ['2001:db8::1'],
    ipv6Mode: IPV6_CONFIGURATION_MODE.NONE,
    mac: '00:11:22:33:44:55',
    management: true,
    mode: IP_CONFIGURATION_MODE.STATIC,
    mtu: 1500,
    netmask: '255.255.255.0',
    physical: true,
    primaryAddressType: PRIMARY_ADDRESS_TYPE.IPV4,
    speed: 1000,
    vlan: -1,
    isBondMaster: false,
    isBondSlave: false,
    bondSlaves: [],
    ...overrides,
  }
}
