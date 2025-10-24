import type { XoPbd } from '@/types/xo/pbd.type'
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
  usage: number
  size: number
  SR_type: string
  VDIs: XoVdi['id'][]
  shared: boolean
  sm_config: Record<string, string>
  other_config: Record<string, string>
  tags: string[]
  allocationStrategy?: 'thin' | 'thick' | 'unknown'
  $PBDs: XoPbd['id'][]
}
