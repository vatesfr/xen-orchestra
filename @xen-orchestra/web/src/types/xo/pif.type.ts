import type { XoHost } from '@/types/xo/host.type'
import type { XoNetwork } from '@/types/xo/network.type'
import type { Branded } from '@core/types/utility.type'

export type XoPif = {
  $host: XoHost['id']
  $network: XoNetwork['id']
  attached: boolean
  carrier: boolean
  device: string
  dns: string
  gateway: string
  id: Branded<'pif'>
  ip: string
  ipv6: string[]
  mac: string
  management: boolean
  mode: string
  mtu: number
  netmask: string
  speed: number
  vlan: number
  isBondMaster: boolean
  bondSlaves: XoPif['id'][]
}
