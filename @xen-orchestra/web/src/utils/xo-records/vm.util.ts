import { VM_OPERATION, type XoVm } from '@/types/xo/vm.type.ts'
import { castArray } from 'lodash-es'

export function isVmOperatingPending(vm: XoVm, operations: VM_OPERATION[] | VM_OPERATION) {
  const currentOperations = Object.values(vm.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}
