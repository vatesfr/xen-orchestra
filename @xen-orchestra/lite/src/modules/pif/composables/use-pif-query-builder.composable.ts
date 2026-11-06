import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { usePifMetricsStore } from '@/stores/xen-api/pif-metrics.store.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { IP_CONFIGURATION_MODE } from '@vates/types'
import humanFormat from 'human-format'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

type PifStatus =
  | typeof CONNECTION_STATUS.CONNECTED
  | typeof CONNECTION_STATUS.DISCONNECTED
  | typeof CONNECTION_STATUS.DISCONNECTED_FROM_PHYSICAL_DEVICE

export type PifFilterableData = XenApiPif & {
  network_name: string
  status: PifStatus
  ip_addresses: string[]
  is_bond: boolean
  bond_devices: string[]
  speed: number
  nbd: boolean
  tags: string[]
}

// In Mb/s, like the speed reported by the PIF metrics
const SPEEDS = [100, 1000, 10000, 25000, 40000, 100000]

export function usePifQueryBuilder(
  id: string,
  rawPifs: MaybeRefOrGetter<XenApiPif[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const { getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
  const { getPifStatus, getBondsDevices, isBondMaster } = usePifStore().subscribe()
  const { getByOpaqueRef: getPifMetricsByOpaqueRef } = usePifMetricsStore().subscribe()

  const pifs = toComputed(rawPifs)

  const filterablePifs = computed(() =>
    pifs.value.map(pif => {
      const network = getNetworkByOpaqueRef(pif.network)

      return {
        ...pif,
        network_name: network?.name_label ?? '',
        status: getPifStatus(pif),
        ip_addresses: [pif.IP, ...pif.IPv6].filter(ip => ip),
        is_bond: isBondMaster(pif),
        bond_devices: getBondsDevices(pif).filter(device => device !== undefined),
        speed: getPifMetricsByOpaqueRef(pif.metrics)?.speed ?? 0,
        nbd: network?.purpose?.[0] !== undefined,
        tags: network?.tags ?? [],
      } satisfies PifFilterableData
    })
  )

  const { items, filter } = useQueryBuilderFilter(id, filterablePifs, options)

  const schema = useQueryBuilderSchema<PifFilterableData>({
    '': useStringSchema(t('any-property')),
    network_name: useStringSchema(t('network')),
    device: useStringSchema(t('device')),
    management: useBooleanSchema(t('management'), {
      true: t('yes'),
      false: t('no'),
    }),
    status: useStringSchema(t('status'), {
      [CONNECTION_STATUS.CONNECTED]: t('connected'),
      [CONNECTION_STATUS.DISCONNECTED]: t('disconnected'),
      [CONNECTION_STATUS.DISCONNECTED_FROM_PHYSICAL_DEVICE]: t('disconnected-from-physical-device'),
    } satisfies Record<PifStatus, string>),
    VLAN: useNumberSchema(t('vlan')),
    ip_addresses: useStringSchema(t('ip-address')),
    MAC: useStringSchema(t('mac-address')),
    ip_configuration_mode: useStringSchema(t('mode'), {
      [IP_CONFIGURATION_MODE.STATIC]: t('static'),
      [IP_CONFIGURATION_MODE.DHCP]: t('dhcp'),
      [IP_CONFIGURATION_MODE.NONE]: t('none'),
    } satisfies Record<IP_CONFIGURATION_MODE, string>),
    is_bond: useBooleanSchema(t('bond'), {
      true: t('yes'),
      false: t('no'),
    }),
    bond_devices: useStringSchema(t('bond-devices')),
    netmask: useStringSchema(t('netmask')),
    DNS: useStringSchema(t('dns')),
    gateway: useStringSchema(t('gateway')),
    MTU: useNumberSchema(t('mtu')),
    speed: useNumberSchema(
      t('speed'),
      Object.fromEntries(SPEEDS.map(speed => [speed, humanFormat(speed * 1000000, { scale: 'SI', unit: 'b/s' })]))
    ),
    nbd: useBooleanSchema(t('network-block-device'), {
      true: t('on'),
      false: t('off'),
    }),
    tags: useStringSchema(t('tags')),
    uuid: useStringSchema(t('uuid')),
  })

  return { items, filter, schema }
}
