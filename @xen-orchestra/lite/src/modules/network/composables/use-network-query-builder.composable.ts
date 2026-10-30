import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import { useNetworkUtils } from '@/modules/network/composables/network-utils.composable.ts'
import { useVlanSchema } from '@/modules/pif/composables/use-vlan-schema.composable.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import type { getConnectionStatus } from '@core/utils/connection.util.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { NETWORK_DEFAULT_LOCKING_MODE } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

type NetworkStatus = ReturnType<typeof getConnectionStatus>

export type NetworkFilterableData = XenApiNetwork & {
  status: NetworkStatus
  // VLAN of the first PIF of the network (-1 when there is no VLAN, undefined when there is no PIF)
  vlan: number | undefined
}

export function useNetworkQueryBuilder(
  id: string,
  rawNetworks: MaybeRefOrGetter<XenApiNetwork[]>,
  { internal = false, ...filterOptions }: Parameters<typeof useQueryBuilderFilter>[2] & { internal?: boolean } = {}
) {
  const { t } = useI18n()

  const { records: pifs } = usePifStore().subscribe()
  const { getNetworkStatus } = useNetworkUtils()

  const networks = toComputed(rawNetworks)

  const getNetworkVlan = (network: XenApiNetwork) => pifs.value.find(pif => network.PIFs.includes(pif.$ref))?.VLAN

  const filterableNetworks = computed(() =>
    networks.value.map(
      network =>
        ({
          ...network,
          status: getNetworkStatus(network),
          vlan: getNetworkVlan(network),
        }) satisfies NetworkFilterableData
    )
  )

  const { items, filter } = useQueryBuilderFilter(id, filterableNetworks, filterOptions)

  const schema = useQueryBuilderSchema<NetworkFilterableData>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    ...(internal
      ? {}
      : {
          status: useStringSchema(t('status'), {
            [CONNECTION_STATUS.CONNECTED]: t('connected'),
            [CONNECTION_STATUS.PARTIALLY_CONNECTED]: t('partially-connected'),
            [CONNECTION_STATUS.DISCONNECTED]: t('disconnected'),
          } satisfies Record<NetworkStatus, string>),
          vlan: useVlanSchema(),
        }),
    MTU: useNumberSchema(t('mtu')),
    default_locking_mode: useStringSchema(t('default-locking-mode'), {
      [NETWORK_DEFAULT_LOCKING_MODE.DISABLED]: t('disabled'),
      [NETWORK_DEFAULT_LOCKING_MODE.UNLOCKED]: t('unlocked'),
    } satisfies Record<NETWORK_DEFAULT_LOCKING_MODE, string>),
  })

  return { items, filter, schema }
}
