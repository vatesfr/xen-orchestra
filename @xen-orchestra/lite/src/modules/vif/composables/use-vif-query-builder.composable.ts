import type { XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { getUniqueIpAddressesForDevice } from '@core/utils/ip-address.utils.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { VIF_LOCKING_MODE } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export type VifFilterableData = XenApiVif & {
  network_name: string
  ip_addresses: string[]
  device_label: string
}

export function useVifQueryBuilder(
  id: string,
  rawVifs: MaybeRefOrGetter<XenApiVif[]>,
  { vm: rawVm, ...filterOptions }: Parameters<typeof useQueryBuilderFilter>[2] & { vm: MaybeRefOrGetter<XenApiVm> }
) {
  const { t } = useI18n()

  const { getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
  const { getByOpaqueRef: getGuestMetricsByOpaqueRef } = useVmGuestMetricsStore().subscribe()

  const vifs = toComputed(rawVifs)
  const vm = toComputed(rawVm)

  const guestNetworks = computed(() => getGuestMetricsByOpaqueRef(vm.value.guest_metrics)?.networks)

  const filterableVifs = computed(() =>
    vifs.value.map(
      vif =>
        ({
          ...vif,
          network_name: getNetworkByOpaqueRef(vif.network)?.name_label ?? '',
          ip_addresses: getUniqueIpAddressesForDevice(guestNetworks.value, vif.device),
          device_label: t('vif-device', { device: vif.device }),
        }) satisfies VifFilterableData
    )
  )

  const { items, filter } = useQueryBuilderFilter(id, filterableVifs, filterOptions)

  const schema = useQueryBuilderSchema<VifFilterableData>({
    '': useStringSchema(t('any-property')),
    network_name: useStringSchema(t('network')),
    device_label: useStringSchema(t('device')),
    currently_attached: useBooleanSchema(t('status'), {
      true: t('connected'),
      false: t('disconnected'),
    }),
    ip_addresses: useStringSchema(t('ip-addresses')),
    MAC: useStringSchema(t('mac-addresses')),
    MTU: useNumberSchema(t('mtu')),
    locking_mode: useStringSchema(t('locking-mode'), {
      [VIF_LOCKING_MODE.NETWORK_DEFAULT]: t('network-default'),
      [VIF_LOCKING_MODE.LOCKED]: t('locked'),
      [VIF_LOCKING_MODE.UNLOCKED]: t('unlocked'),
      [VIF_LOCKING_MODE.DISABLED]: t('disabled'),
    } satisfies Record<VIF_LOCKING_MODE, string>),
  })

  return { items, filter, schema }
}
