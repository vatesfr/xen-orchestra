import type { XoHost } from '@/types/xo/host.type'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPool } from '@/types/xo/pool.type'

export type XoPif = {
  $host: XoHost['id']
  $network: string
  $poolId: XoPool['id']
  allIps: string[]
  attached: boolean
  carrier: boolean
  defaultLockingMode: XoNetwork['defaultIsLocked']
  device: string
  deviceName: string
  dns: string
  gateway: string
  ip: string
  ipv6: string[]
  ipv6Mode: string
  mac: string
  mode: string
  mtu: XoNetwork['mtu']
  nbd: XoNetwork['nbd']
  netmask: string
  networkLabel: XoNetwork['name_label']
  selected: boolean
  speed: number
  tags: XoNetwork['tags']
  uuid: string
  vlan: number
}
