import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { castArray } from 'lodash-es'

export function isVmOperationPending(vm: FrontXoVm, operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  const currentOperations = Object.values(vm.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}

export function areVmsOperationPending(vms: FrontXoVm[], operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  return vms.some(vm => isVmOperationPending(vm, operations))
}

export function getVmsPendingOperation(vms: FrontXoVm[], operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  for (const vm of vms) {
    const currentOperations = Object.values(vm.current_operations)
    const currentOperation = castArray(operations).find(operation => currentOperations.includes(operation))

    if (currentOperation !== undefined) {
      return currentOperation
    }
  }
}

export function areAllVmsHavingPowerState(vms: FrontXoVm[], powerStates: VM_POWER_STATE[]) {
  return vms.every(vm => powerStates.includes(vm.power_state))
}

export function notAllVmsHavingPowerState(vms: FrontXoVm[], powerStates: VM_POWER_STATE[]) {
  return !areAllVmsHavingPowerState(vms, powerStates)
}

export function getVmIpAddresses(vm: FrontXoVm) {
  const addresses = vm.addresses

  return addresses ? [...Object.values(addresses).sort()] : []
}

export function extractVmHostId(vm: FrontXoVm) {
  return vm.$container === vm.$pool ? undefined : (vm.$container as FrontXoHost['id'])
}
