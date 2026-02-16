import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import type { VtsLinkCellProps } from '@core/components/table/cells/VtsLinkCell.vue'
import { icon } from '@core/icons/index.ts'

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
