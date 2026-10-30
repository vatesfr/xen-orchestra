import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { getHostIpAddresses } from '@/modules/pif/utils/pif.util.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export type HostFilterableData = XenApiHost & {
  power_state: HOST_POWER_STATE
  ip_addresses: string[]
}

export function useHostQueryBuilder(
  id: string,
  rawHosts: MaybeRefOrGetter<XenApiHost[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const { getHostPowerState } = useHostMetricsStore().subscribe()
  const { pifsByHost } = usePifStore().subscribe()

  const hosts = toComputed(rawHosts)

  const filterableHosts = computed(() =>
    hosts.value.map(
      host =>
        ({
          ...host,
          power_state: getHostPowerState(host),
          ip_addresses: getHostIpAddresses(host.address, pifsByHost.value.get(host.$ref)),
        }) satisfies HostFilterableData
    )
  )

  const { items, filter } = useQueryBuilderFilter(id, filterableHosts, options)

  const schema = useQueryBuilderSchema<HostFilterableData>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    ip_addresses: useStringSchema(t('management-ip')),
    power_state: useStringSchema(t('power-state'), {
      [HOST_POWER_STATE.RUNNING]: t('status:running'),
      [HOST_POWER_STATE.HALTED]: t('status:halted'),
      [HOST_POWER_STATE.UNKNOWN]: t('status:unknown'),
    } satisfies Record<HOST_POWER_STATE, string>),
    tags: useStringSchema(t('tags')),
  })

  return { items, filter, schema }
}
