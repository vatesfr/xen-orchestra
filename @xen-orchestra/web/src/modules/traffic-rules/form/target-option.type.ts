import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { type IconName } from '@core/icons'

export type TargetOption = {
  id: FrontXoVif['id'] | FrontXoNetwork['id']
  label: string
  value: FrontXoVif['id'] | FrontXoNetwork['id']
  icon: 'object:network' | 'object:vif'
}

export type VmOption = {
  id: FrontXoVm['id']
  label: string
  value: FrontXoVm['id']
  icon: IconName
}
