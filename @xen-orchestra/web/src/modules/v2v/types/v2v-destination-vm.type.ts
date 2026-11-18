import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { IconName } from '@core/icons'

export type V2vDestinationVm = {
  id: FrontXoVm['id']
  name: string
  icon: IconName
  powerLabel: string
}
