import type { XoHost } from './host.type'
import type { XoPool } from './pool.type'

export type XoPci = {
  $pool: XoPool['id']
  /** @deprecated */
  $poolId: XoPool['id']
  _xapiRef: string
  uuid: string
  $host?: XoHost['id']
  class_name: string
  device_name: string
  id: string
  pci_id: string
  type: string
}
