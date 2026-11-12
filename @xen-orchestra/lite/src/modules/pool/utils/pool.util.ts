import type { XenApiPool } from '@/libs/xen-api/xen-api.types.ts'
import type { POOL_ALLOWED_OPERATIONS } from '@vates/types'
import { castArray } from 'lodash-es'

export const isPoolOperationPending = (
  pool: XenApiPool,
  operations: POOL_ALLOWED_OPERATIONS[] | POOL_ALLOWED_OPERATIONS
) => {
  const currentOperations = Object.values(pool.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}
