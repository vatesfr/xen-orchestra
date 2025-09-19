import type { XoVm } from '@/types/xo/vm.type.ts'
import type { Branded } from '@core/types/utility.type'

export type XoProxy = {
  id: Branded<'proxy'>
  url: string
  version?: string
  name: string
} & (
  | { address?: undefined; vmUuid: XoVm['id'] }
  | { address: string; vmUuid?: undefined }
  | { address: string; vmUuid: XoVm['id'] }
)
