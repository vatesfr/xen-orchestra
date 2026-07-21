import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useArrayFilter } from '@vueuse/shared'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function useNetworkPifSelect(
  model: Ref<unknown>,
  options: {
    multiple?: boolean
    bonded?: boolean
    value: keyof XenApiPif | ((pif: XenApiPif) => unknown)
  }
) {
  const { t } = useI18n()

  const { records: pifs, isBondMaster } = usePifStore().subscribe()
  const { getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
  const { pool } = usePoolStore().subscribe()

  const usablePifs = useArrayFilter(pifs, pif => {
    const isBondSlave = pif.bond_slave_of !== 'OpaqueRef:NULL'
    const isVlanSlave = pif.VLAN !== -1
    const isOnMasterHost = pif.host === pool.value?.master

    return !isBondSlave && !isVlanSlave && isOnMasterHost && (!options.bonded || !isBondMaster(pif))
  })

  const { id: interfacesSelectId } = useFormSelect(usablePifs, {
    searchable: true,
    required: true,
    multiple: options.multiple,
    placeholder: t('new-network:select-interface'),
    model,
    option: {
      id: '$ref',
      label: pif => getNetworkByOpaqueRef(pif.network)?.name_label ?? pif.device,
      value: options.value,
    },
  })

  return { interfacesSelectId }
}
