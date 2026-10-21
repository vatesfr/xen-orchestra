import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { IP_CONFIGURATION_MODE, IPV6_CONFIGURATION_MODE, PRIMARY_ADDRESS_TYPE } from '@vates/types'

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
    ip: '192.168.1.10',
    ipv6: [],
    mac: '00:00:00:00:00:01',
    management: false,
    mode: IP_CONFIGURATION_MODE.DHCP,
    mtu: 1500,
    netmask: '255.255.255.0',
    speed: 1000,
    vlan: -1,
    isBondMaster: false,
    isBondSlave: false,
    bondSlaves: [],
    physical: true,
    type: 'PIF',
    ipv6Mode: IPV6_CONFIGURATION_MODE.NONE,
    primaryAddressType: PRIMARY_ADDRESS_TYPE.IPV4,
    ...overrides,
  }
}

export function createManagementPif(pool: FrontXoPool, network: FrontXoPif['$network']): FrontXoPif {
  return createPif({ $host: pool.master, $pool: pool.id, $network: network, management: true })
}
