import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { type IconName, objectIcon } from '@core/icons'
import { toLower } from 'lodash-es'

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

export function vifToTargetOption(vif: FrontXoVif, vifLabel: string): TargetOption {
  return {
    id: vif.id,
    label: vifLabel,
    value: vif.id,
    icon: 'object:vif',
  }
}

export function networkToTargetOption(network: FrontXoNetwork): TargetOption {
  return {
    id: network.id,
    label: network.name_label,
    value: network.id,
    icon: 'object:network',
  }
}

export function vmToTargetOption(vm: FrontXoVm): VmOption {
  return {
    id: vm.id,
    label: vm.name_label,
    value: vm.id,
    icon: objectIcon('vm', toLower(vm.power_state)),
  }
}
