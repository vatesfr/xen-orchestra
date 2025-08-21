import type { XoVm, VM_OPERATIONS } from '@vates/types'
import { castArray } from 'lodash-es'

export function isVmOperatingPending(vm: XoVm, operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  const currentOperations = Object.values(vm.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}
