import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types'

export interface Disk {
  name_label: string
  name_description: string
  size?: number
  SR: string | undefined
  type?: string
}

export interface NetworkInterface {
  interface: XenApiNetwork['$ref'] | string
  macAddress: string
  device: string
}
