import { VM_POWER_STATE, type VM_OPERATIONS, type XoVm } from '@vates/types'
import { castArray } from 'lodash-es'

export function isVmOperationPending(vm: XoVm, operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  const currentOperations = Object.values(vm.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}

export function areVmsOperationPending(vms: XoVm[], operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  return vms.some(vm => isVmOperationPending(vm, operations))
}

export function areAllVmsHavingPowerState(vms: XoVm[], powerStates: VM_POWER_STATE[]) {
  return vms.every(vm => powerStates.includes(vm.power_state))
}

export function notAllVmsHavingPowerState(vms: XoVm[], powerStates: VM_POWER_STATE[]) {
  return !areAllVmsHavingPowerState(vms, powerStates)
}

export function getVmIpAddresses(vm: XoVm) {
  const addresses = vm.addresses

  return addresses ? [...Object.values(addresses).sort()] : []
}
