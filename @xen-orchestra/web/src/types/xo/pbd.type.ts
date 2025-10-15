import type { XoHost } from '@/types/xo/host.type'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoSr } from '@/types/xo/sr.type'
import type { Branded } from '@core/types/utility.type.ts'

export type XoPbd = {
  id: Branded<'PBD'>
  type: 'PBD'
  attached: boolean
  host: XoHost['id']
  SR: XoSr['id']
  device_config: Record<string, unknown>
  otherConfig: Record<string, unknown>
  $pool: XoPool['id']
}
