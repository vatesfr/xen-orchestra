import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getPoolInfo } from '@/modules/pool/utils/xo-pool.util.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import { icon, objectIcon } from '@core/icons'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from '@vueuse/core'
import { toLower } from 'lodash-es'
import { computed } from 'vue'

export interface PoolFilterableData extends FrontXoServer {
  // Raw values for filtering
  poolName: string
  masterHostIp: string
  poolStatus: Status
  primaryHostName: string
}

export interface PoolDisplayData extends PoolFilterableData {
  // Formatted values for UI display
  poolIcon: ReturnType<typeof icon>
  hostIcon: ReturnType<typeof objectIcon> | undefined
  primaryHostIcon: ReturnType<typeof objectIcon> | undefined
  primaryHostRightIcon: ReturnType<typeof icon> | undefined
}

export function usePoolEnhancedData(rawServers: MaybeRefOrGetter<FrontXoServer[]>) {
  const servers = toComputed(rawServers)
  const { getHostById, isMasterHost } = useXoHostCollection()

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
    const hostIcon = host ? objectIcon('host', toLower(host.power_state)) : undefined
    const primaryHostRightIcon = host ? getMasterIcon(host) : undefined

    return {
      ...pool,
      poolIcon: icon('object:pool'),
      hostIcon,
      primaryHostIcon: hostIcon,
      primaryHostRightIcon,
    }
  }

  return {
    filterableServers: filterablePools,
    getDisplayData,
  }
}
