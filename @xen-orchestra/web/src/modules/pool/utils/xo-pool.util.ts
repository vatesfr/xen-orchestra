import type { VtsLinkCellProps } from '@core/components/table/cells/VtsLinkCell.vue'
import { icon } from '@core/icons/index.ts'
import type { XoServer } from '@vates/types'

export function getPoolInfo(server: XoServer): VtsLinkCellProps & { label: string } {
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
