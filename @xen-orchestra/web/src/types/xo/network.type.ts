import type { XoPool } from '@/types/xo/pool.type'
import type { Branded } from '@core/types/utility.type'

export type XoNetwork = {
  $pool: XoPool['id']
  default_locking_mode: string
  id: Branded<'network'>
  name_label: string
  name_description: string
  MTU: number
  nbd: boolean
  other_config: { automatic: string }
  tags: string[]
  PIFs: string[]
}
