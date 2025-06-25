import type { Branded } from '@core/types/utility.type.ts'

export type XoPci = {
  device_name: string
  id: Branded<'PCI'>
  type: 'PCI'
}
