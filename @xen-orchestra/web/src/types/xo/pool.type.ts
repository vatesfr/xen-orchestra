import type { XoHost } from '@/types/xo/host.type'
import type { Branded } from '@core/types/utility.type'

export type XoPool = {
  id: Branded<'pool'>
  type: 'pool'
  $pool: XoPool['id']
  master: XoHost['id']
  name_description: string
  name_label: string
  _xapiRef: string
  default_SR: string
}
