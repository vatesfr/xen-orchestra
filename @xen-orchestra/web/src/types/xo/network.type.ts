import type { Branded } from '@core/types/utility.type'

export type XoNetwork = {
  defaultIsLocked: boolean
  id: Branded<'network'>
  name_label: string
  nbd: boolean
  tags: string[]
}
