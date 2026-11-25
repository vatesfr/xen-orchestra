import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { NETWORK_TYPE, type NetworkType } from '@/modules/network/utils/xo-network.util.ts'
import { type FrontXoPif, useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useFormSelect } from '@core/packages/form-select'
import { IP_CONFIGURATION_MODE } from '@vates/types'
import { useArrayFilter } from '@vueuse/shared'
import { type Ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export function useNetworkPifSelect(
  selectedPool: Ref<FrontXoPool | undefined>,
  model: Ref<unknown>,
  options: {
    multiple?: boolean
    networkType: Exclude<NetworkType, typeof NETWORK_TYPE.INTERNAL>
    value: keyof FrontXoPif | ((pif: FrontXoPif) => unknown)
  }
) {
  const { t } = useI18n()
  const { pifs } = useXoPifCollection()
  const { getNetworkById } = useXoNetworkCollection()

  function getPifDetails(pif: FrontXoPif) {
    if (pif.vlan === -1) {
      return pif.device
    }

    return t('pif-device-vlan', { device: pif.device, vlan: pif.vlan })
  }

  const usablePifs = useArrayFilter(pifs, pif => {
    if (pif.isBondSlave || pif.$host !== selectedPool.value?.master) {
      return false
    }

    if (options.networkType === NETWORK_TYPE.PRIVATE) {
      const canCarryTunnels = pif.isBondMaster || pif.physical || pif.vlan !== -1

      return canCarryTunnels && pif.mode !== IP_CONFIGURATION_MODE.NONE
    }

    if (pif.vlan !== -1) {
      return false
    }

    if (options.networkType === NETWORK_TYPE.BONDED) {
      return !pif.isBondMaster
    }

    return true
  })

  const { id: interfacesSelectId } = useFormSelect(usablePifs, {
    searchable: true,
    required: true,
    multiple: options.multiple,
    placeholder: t('new-network:select-interface'),
    model,
    option: {
      label: pif => getNetworkById(pif.$network)?.name_label ?? pif.device,
      value: options.value,
      properties: pif => ({ details: getPifDetails(pif) }),
    },
  })

  watch(
    () => selectedPool.value?.id,
    () => {
      if (options.multiple) {
        if (Array.isArray(model.value) && model.value.length > 0) {
          model.value = []
        }
      } else {
        model.value = undefined
      }
    }
  )

  return { interfacesSelectId }
}
