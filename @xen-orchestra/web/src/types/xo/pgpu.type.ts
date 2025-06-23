import type { Branded } from '@core/types/utility.type.ts'
import type { XoPci } from './pci.type'

export type XoPgpu = {
  id: Branded<'Pgpu'>
  type: 'Pgpu'
  pci?: XoPci['pci_id']
}
