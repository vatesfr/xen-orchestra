import type { XoPool } from '@/types/xo/pool.type'
import type { XoVdi } from '@/types/xo/vdi.type'
import type { Branded } from '@core/types/utility.type'

export type XoSr = {
  $pool: XoPool['id']
  type: 'SR'
  id: Branded<'sr'>
  name_label: string
  name_description: string
  content_type: string
  physical_usage: number
  size: number
  SR_type: string
  VDIs: XoVdi['id'][]
}
