import type { VM_OPERATIONS, XoVm } from '@vates/types'
import { castArray } from 'lodash-es'

export function isVmOperationPending(vm: XoVm, operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  const currentOperations = Object.values(vm.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}

export function areVmsOperationPending(vms: XoVm[], operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  return vms.some(vm => isVmOperationPending(vm, operations))
}

export function getVmIpAddresses(vm: XoVm) {
  const addresses = vm.addresses

  return addresses ? [...Object.values(addresses).sort()] : []
}
