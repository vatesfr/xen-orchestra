import type { XoHost } from '@/types/xo/host.type'
import type { XoNetwork } from '@/types/xo/network.type'

export type XoPif = {
  $host: XoHost['id']
  $network: XoNetwork['id']
  allIps: string[]
  attached: boolean
  carrier: boolean
  device: string
  dns: string
  gateway: string
  id: string
  ip: string
  ipv6: string[]
  mac: string
  mode: string
  mtu: string
  netmask: string
  speed: number
  vlan: number
}
