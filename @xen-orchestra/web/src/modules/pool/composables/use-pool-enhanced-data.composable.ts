import { useXoHostOperationLabel } from '@/modules/host/composables/xo-host-operation-label.composable.ts'
import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostIcon } from '@/modules/host/utils/xo-host.util.ts'
import { getPoolInfo } from '@/modules/pool/utils/xo-pool.util.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import { icon, objectIcon } from '@core/icons'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export interface PoolFilterableData extends FrontXoServer {
  // Raw values for filtering
  poolName: string
  masterHostIp: string
  poolStatus: Status
  primaryHostName: string
}

export interface PoolDisplayData extends PoolFilterableData {
  // Formatted values for UI display
  poolIcon: ReturnType<typeof icon> | undefined
  hostIcon: ReturnType<typeof objectIcon> | undefined
  primaryHostIcon: ReturnType<typeof objectIcon> | undefined
  primaryHostIconTooltip: string
  primaryHostRightIcon: ReturnType<typeof icon> | undefined
}

export function usePoolEnhancedData(rawServers: MaybeRefOrGetter<FrontXoServer[]>) {
  const servers = toComputed(rawServers)
  const { getHostById, isMasterHost } = useXoHostCollection()
  const { getHostIconTooltip } = useXoHostOperationLabel()

  /**
   * Get master host icon if applicable
   */
  const getMasterIcon = (host: FrontXoHost) => {
    if (!isMasterHost(host.id)) {
      return undefined
    }

    return icon('status:primary-circle')
  }

  /**
   * Filterable data: raw values for Query Builder schema
   */
  const filterablePools = computed(() =>
    servers.value.map(server => {
      const host = getHostById(server.master)
      const poolInfo = getPoolInfo(server)

      return {
        ...server,
        poolName: poolInfo.label,
        masterHostIp: server.host,
        poolStatus: server.error ? 'unable-to-connect-to-the-pool' : server.status,
        primaryHostName: host?.name_label ?? '',
      } as PoolFilterableData
    })
  )

  /**
   * Display data: enhanced pool with formatted values for table rendering
   */
  const getDisplayData = (pool: PoolFilterableData): PoolDisplayData => {
    const host = getHostById(pool.master)
    const hostIcon = host ? getHostIcon(host) : undefined
    const primaryHostRightIcon = host ? getMasterIcon(host) : undefined

    return {
      ...pool,
      poolIcon: getPoolInfo(pool).icon,
      hostIcon,
      primaryHostIcon: hostIcon,
      primaryHostIconTooltip: getHostIconTooltip(host),
      primaryHostRightIcon,
    }
  }

  return {
    filterableServers: filterablePools,
    getDisplayData,
  }
}
