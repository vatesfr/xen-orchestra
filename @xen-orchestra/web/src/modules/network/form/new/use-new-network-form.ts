import { type BaseNetworkFormData, useNetworkFormBase } from '@/modules/network/form/use-network-form-base.ts'
import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import type { NewNetworkPayload } from '@/modules/network/jobs/xo-network-create.job.ts'
import { NETWORK_TYPE } from '@/modules/network/utils/xo-network.util.ts'
import { type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { required, withMessage } from '@core/packages/form-validation'
import { type MaybeRefOrGetter, reactive, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

export type NewNetworkFormData = BaseNetworkFormData & {
  pif: FrontXoPif['id'] | undefined
  vlan: number | undefined
}

export function useNewNetworkForm(_poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const formData = reactive<NewNetworkFormData>({
    pool: undefined,
    pif: undefined,
    name: '',
    description: '',
    mtu: undefined,
    vlan: undefined,
    nbd: 'none',
  })

  const { t } = useI18n()

  const {
    useField,
    useSelect,
    validate,
    selectedPool,
    buildBasePayload,
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdRadioBindings,
  } = useNetworkFormBase(_poolId, formData, {
    errors: {
      onSubmit: () => ({
        pif: { required: withMessage(required, () => t('interface-required')) },
        vlan: { required: withMessage(required, () => t('vlan-required')) },
      }),
    },
  })

  const { interfacesSelectId } = useNetworkPifSelect(selectedPool, toRef(formData, 'pif'), {
    networkType: NETWORK_TYPE.PHYSICAL,
    value: 'id',
  })

  async function validateAndBuildPayload(): Promise<NewNetworkPayload | undefined> {
    if (!(await validate())) {
      return undefined
    }

    return {
      ...buildBasePayload(),
      pif: formData.pif!,
      vlan: formData.vlan!,
    }
  }

  return {
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdRadioBindings,
    interfaceSelectBindings: useSelect(interfacesSelectId, 'pif', () => ({ label: t('interface') })),
    vlanInputBindings: useField('vlan', () => ({ label: t('vlan'), required: true })),
    validateAndBuildPayload,
  }
}
