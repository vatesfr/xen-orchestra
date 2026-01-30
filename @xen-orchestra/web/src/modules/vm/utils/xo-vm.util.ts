import { VM_OPERATIONS, VM_POWER_STATE, type XoVm } from '@vates/types'
import { castArray } from 'lodash-es'

export const CHANGING_STATE_OPERATIONS: Partial<VM_OPERATIONS>[] = [
  VM_OPERATIONS.START,
  VM_OPERATIONS.START_ON,
  VM_OPERATIONS.PAUSE,
  VM_OPERATIONS.UNPAUSE,
  VM_OPERATIONS.RESUME,
  VM_OPERATIONS.SUSPEND,
  VM_OPERATIONS.CLEAN_REBOOT,
  VM_OPERATIONS.HARD_REBOOT,
  VM_OPERATIONS.SHUTDOWN,
  VM_OPERATIONS.CLEAN_SHUTDOWN,
  VM_OPERATIONS.HARD_SHUTDOWN,
  VM_OPERATIONS.SNAPSHOT,
  VM_OPERATIONS.DESTROY,
]

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
