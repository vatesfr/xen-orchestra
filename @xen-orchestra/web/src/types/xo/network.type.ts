import type { XoPool } from '@/types/xo/pool.type'
import type { Branded } from '@core/types/utility.type'

export type XoNetwork = {
  $pool: Branded<XoPool['id']>
  defaultIsLocked: boolean
  id: Branded<'network'>
  name_label: string
  name_description: string
  MTU: number
  nbd: boolean
  tags: string[]
  PIFs: string[]
}
