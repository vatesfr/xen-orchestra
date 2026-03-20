import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { type FrontXoPif, useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useArrayFilter } from '@vueuse/shared'
import { type Ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export function useNetworkPifSelect(
  selectedPool: Ref<FrontXoPool | undefined>,
  model: Ref<unknown>,
  options: {
    multiple?: boolean
    bonded?: boolean
    value: keyof FrontXoPif | ((pif: FrontXoPif) => unknown)
  }
) {
  const { t } = useI18n()
  const { pifs } = useXoPifCollection()
  const { getNetworkById } = useXoNetworkCollection()

  const usablePifs = useArrayFilter(
    pifs,
    pif =>
      !pif.isBondSlave &&
      (!options.bonded || !pif.isBondMaster) &&
      pif.vlan === -1 &&
      pif.$host === selectedPool.value?.master
  )

  const { id: interfacesSelectId } = useFormSelect(usablePifs, {
    searchable: true,
    required: true,
    multiple: options.multiple,
    placeholder: t('new-network:select-interface'),
    model,
    option: {
      label: pif => getNetworkById(pif.$network)?.name_label ?? pif.device,
      value: options.value,
    },
  })

  watch(
    () => selectedPool.value?.id,
    () => {
      if (options.multiple) {
        if ((model.value as unknown[]).length > 0) {
          model.value = []
        }
      } else {
        model.value = undefined
      }
    }
  )

  return { interfacesSelectId }
}
