import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import type { VtsLinkCellProps } from '@core/components/table/cells/VtsLinkCell.vue'
import { icon } from '@core/icons'
import type { POOL_ALLOWED_OPERATIONS } from '@vates/types'
import { castArray } from 'lodash-es'

export function getPoolInfo(server: FrontXoServer): VtsLinkCellProps & { label: string } {
  if (server.poolNameLabel) {
    return {
      label: server.poolNameLabel,
      to: server.poolId ? `/pool/${server.poolId}/dashboard` : undefined,
      icon: icon('object:pool'),
    }
  }

  if (server.poolId) {
    return {
      label: server.poolId,
      to: `/pool/${server.poolId}/dashboard`,
      icon: icon('object:pool'),
    }
  }

  return {
    label: '',
    to: undefined,
    icon: undefined,
  }
}

export function isPoolOperationPending(
  pool: FrontXoPool,
  operations: POOL_ALLOWED_OPERATIONS[] | POOL_ALLOWED_OPERATIONS
) {
  const currentOperations = Object.values(pool.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}
