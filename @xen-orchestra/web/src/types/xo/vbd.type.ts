import type { XoVdi } from '@/types/xo/vdi.type'
import type { Branded } from '@core/types/utility.type'

export type XoVbd = {
  id: Branded<'vbd'>
  name_label: string
  name_description: string
  VDI: XoVdi['id']
  is_cd_drive: boolean
  position: string
}
