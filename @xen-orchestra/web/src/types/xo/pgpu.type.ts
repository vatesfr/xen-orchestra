import type { Branded } from '@core/types/utility.type.ts'
import type { XoPci } from './pci.type'

export type XoPgpu = {
  id: Branded<'PGPU'>
  type: 'PGPU'
  pci?: XoPci['id']
}
