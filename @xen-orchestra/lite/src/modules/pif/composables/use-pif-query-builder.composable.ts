import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { useVlanSchema } from '@/modules/pif/composables/use-vlan-schema.composable.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { IP_CONFIGURATION_MODE } from '@vates/types'
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
}

export function usePifQueryBuilder(
  id: string,
  rawPifs: MaybeRefOrGetter<XenApiPif[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const { getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
  const { getPifStatus } = usePifStore().subscribe()

  const pifs = toComputed(rawPifs)

  const filterablePifs = computed(() =>
    pifs.value.map(
      pif =>
        ({
          ...pif,
          network_name: getNetworkByOpaqueRef(pif.network)?.name_label ?? '',
          status: getPifStatus(pif),
          ip_addresses: [pif.IP, ...pif.IPv6].filter(ip => ip),
        }) satisfies PifFilterableData
    )
  )

  const { items, filter } = useQueryBuilderFilter(id, filterablePifs, options)

  const schema = useQueryBuilderSchema<PifFilterableData>({
    '': useStringSchema(t('any-property')),
    network_name: useStringSchema(t('network')),
    device: useStringSchema(t('device')),
    status: useStringSchema(t('status'), {
      [CONNECTION_STATUS.CONNECTED]: t('connected'),
      [CONNECTION_STATUS.DISCONNECTED]: t('disconnected'),
      [CONNECTION_STATUS.DISCONNECTED_FROM_PHYSICAL_DEVICE]: t('disconnected-from-physical-device'),
    } satisfies Record<PifStatus, string>),
    VLAN: useVlanSchema(),
    ip_addresses: useStringSchema(t('ip-address')),
    MAC: useStringSchema(t('mac-address')),
    ip_configuration_mode: useStringSchema(t('mode'), {
      [IP_CONFIGURATION_MODE.STATIC]: t('static'),
      [IP_CONFIGURATION_MODE.DHCP]: t('dhcp'),
      [IP_CONFIGURATION_MODE.NONE]: t('none'),
    } satisfies Record<IP_CONFIGURATION_MODE, string>),
  })

  return { items, filter, schema }
}
