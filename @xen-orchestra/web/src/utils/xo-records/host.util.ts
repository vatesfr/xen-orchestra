import type { HOST_ALLOWED_OPERATIONS, XoHost } from '@vates/types'
import { castArray } from 'lodash-es'

export function isHostOperationPending(host: XoHost, operations: HOST_ALLOWED_OPERATIONS[] | HOST_ALLOWED_OPERATIONS) {
  const currentOperations = Object.values(host.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}
