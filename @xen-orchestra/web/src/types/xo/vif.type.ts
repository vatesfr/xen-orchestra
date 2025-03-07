import type { XoNetwork } from '@/types/xo/network.type'
import type { Branded } from '@core/types/utility.type'

export type XoVif = {
  id: Branded<'vif'>
  MAC: string
  $network: XoNetwork['id']
}
