import type { XoHost } from '@/types/xo/host.type'
import type { XoPool } from '@/types/xo/pool.type'

export type XoPif = {
  attached: boolean
  carrier: boolean
  $host: XoHost['id']
  $network: string
  $poolId: XoPool['id']
  device: string
  deviceName: string
  dns: string
  gateway: string
  ip: string
  ipv6: string[]
  ipv6Mode: string
  mac: string
  mode: string
  mtu: string
  netmask: string
  speed: number
  uuid: string
  vlan: number
  networkLabel: string
  tags: string[]
  defaultLockingMode: boolean
  nbd: boolean
  allIps: string[]
}
