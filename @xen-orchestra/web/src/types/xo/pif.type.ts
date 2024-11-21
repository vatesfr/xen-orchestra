import type { XoHost } from '@/types/xo/host.type'
import type { XoNetwork } from '@/types/xo/network.type'

export type XoPif = {
  $host: XoHost['id']
  $network: XoNetwork['id']
  allIps: string[]
  attached: boolean
  carrier: boolean
  defaultLockingMode: boolean
  device: string
  dns: string
  gateway: string
  id: string
  ip: string
  ipv6: string[]
  mac: string
  mode: string
  mtu: string
  nbd: boolean
  netmask: string
  networkLabel: string
  selected: boolean
  speed: number
  tags: string[]
  vlan: number
}
