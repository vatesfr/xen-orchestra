import type { XoPool } from '@/types/xo/pool.type.ts'
import type { XoSr } from '@/types/xo/sr.type'
import type { XoVbd } from '@/types/xo/vbd.type'
import type { Branded } from '@core/types/utility.type'

export type XoVdi = {
  id: Branded<'vdi'>
  name_label: string
  name_description: string
  size: number
  $SR: XoSr['id']
  $VBDs: XoVbd['id'][]
  $pool: XoPool['id']
}
