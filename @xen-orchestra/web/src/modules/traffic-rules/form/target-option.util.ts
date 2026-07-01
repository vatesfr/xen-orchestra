import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { TargetOption, VmOption } from '@/modules/traffic-rules/form/target-option.type.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { objectIcon } from '@core/icons'
import { toLower } from 'lodash-es'

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
