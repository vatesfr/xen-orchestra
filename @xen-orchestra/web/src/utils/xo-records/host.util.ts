import { HOST_OPERATION, type XoHost } from '@/types/xo/host.type.ts'
import { castArray } from 'lodash-es'

export function isHostOperationPending(host: XoHost, operations: HOST_OPERATION[] | HOST_OPERATION) {
  const currentOperations = Object.values(host.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}
