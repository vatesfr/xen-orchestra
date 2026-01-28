import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { VM_OPERATIONS } from '@vates/types'
import { castArray } from 'lodash-es'

export function isVmOperatingPending(vm: FrontXoVm, operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  const currentOperations = Object.values(vm.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}

export function getVmIpAddresses(vm: FrontXoVm) {
  const addresses = vm.addresses

  return addresses ? [...Object.values(addresses).sort()] : []
}
