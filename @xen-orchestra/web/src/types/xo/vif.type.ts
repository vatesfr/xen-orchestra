import type { XoNetwork } from '@/types/xo/network.type'
import type { XoVm } from '@/types/xo/vm.type.ts'
import type { Branded } from '@core/types/utility.type'

export type XoVif = {
  $VM: XoVm['id']
  $network: XoNetwork['id']
  attached: boolean
  device: string
  txChecksumming: boolean
  id: Branded<'vif'>
  lockingMode: string
  MAC: string
  MTU: number
}
