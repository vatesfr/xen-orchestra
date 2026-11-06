import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { getHostManufacturerInfo } from '@/modules/host/utils/host.util.ts'
import { getHostIpAddresses } from '@/modules/pif/utils/pif.util.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/sr-utils.composable.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { SR_SCOPE_TYPE } from '@core/types/storage-repository.type.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export type HostFilterableData = XenApiHost & {
  power_state: HOST_POWER_STATE
  is_master: boolean
  ip_addresses: string[]
  version: string
  manufacturer_info: string
  cpu_count: number
  sr_names: string[]
}

export function useHostQueryBuilder(
  id: string,
  rawHosts: MaybeRefOrGetter<XenApiHost[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const { getHostPowerState } = useHostMetricsStore().subscribe()
  const { pifsByHost } = usePifStore().subscribe()
  const { isMasterHost } = usePoolStore().subscribe()
  const { getSrsForHost } = useSrStore().subscribe()
  const { isConnectedInScope } = useGetPbdsInScope()

  const hosts = toComputed(rawHosts)

  const getConnectedSrNames = (host: XenApiHost) => {
    const scope = { type: SR_SCOPE_TYPE.HOST, hostId: host.$ref } as const

    return getSrsForHost(host.$ref)
      .filter(sr => isConnectedInScope(sr, scope))
      .map(sr => sr.name_label)
  }

  const filterableHosts = computed(() =>
    hosts.value.map(
      host =>
        ({
          ...host,
          power_state: getHostPowerState(host),
          is_master: isMasterHost(host.$ref),
          ip_addresses: getHostIpAddresses(host.address, pifsByHost.value.get(host.$ref)),
          version: host.software_version.product_version,
          manufacturer_info: getHostManufacturerInfo(host),
          cpu_count: Number(host.cpu_info.cpu_count),
          sr_names: getConnectedSrNames(host),
        }) satisfies HostFilterableData
    )
  )

  const { items, filter } = useQueryBuilderFilter(id, filterableHosts, options)

  const schema = useQueryBuilderSchema<HostFilterableData>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    power_state: useStringSchema(t('power-state'), {
      [HOST_POWER_STATE.RUNNING]: t('status:running'),
      [HOST_POWER_STATE.HALTED]: t('status:halted'),
      [HOST_POWER_STATE.UNKNOWN]: t('status:unknown'),
    } satisfies Record<HOST_POWER_STATE, string>),
    is_master: useBooleanSchema(t('master'), {
      true: t('yes'),
      false: t('no'),
    }),
    name_description: useStringSchema(t('description')),
    ip_addresses: useStringSchema(t('management-ip')),
    tags: useStringSchema(t('tags')),
    enabled: useBooleanSchema(t('status'), {
      true: t('enabled'),
      false: t('disabled'),
    }),
    version: useStringSchema(t('version')),
    manufacturer_info: useStringSchema(t('manufacturer-info')),
    cpu_count: useNumberSchema(t('cpus')),
    sr_names: useStringSchema(t('connected-srs')),
    uuid: useStringSchema(t('uuid')),
  })

  return { items, filter, schema }
}
