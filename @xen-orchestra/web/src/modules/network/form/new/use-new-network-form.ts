import { type BaseNetworkFormData, useNetworkFormBase } from '@/modules/network/form/use-network-form-base.ts'
import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import type { NewNetworkPayload } from '@/modules/network/jobs/xo-network-create.job.ts'
import { type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { type FormValidationConfig, outOfRange, required, withMessage } from '@core/packages/form-validation'
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
    nbd: false,
  })

  const { t } = useI18n()

  const vlanMax = 4094

  const extraConfig: FormValidationConfig<NewNetworkFormData> = {
    errors: {
      onSubmit: () => ({
        pif: { required: withMessage(required, () => t('interface-required')) },
      }),
    },
    warnings: {
      onBlur: () => ({
        vlan: {
          outOfRange: withMessage(outOfRange(0, vlanMax), () =>
            t('network-create:warning:vlan-out-of-range', { max: vlanMax })
          ),
        },
      }),
    },
  }

  const {
    selectedPool,
    buildBasePayload,
    validate,
    useField,
    useSelect,
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
  } = useNetworkFormBase(_poolId, formData, extraConfig)

  const { interfacesSelectId } = useNetworkPifSelect(selectedPool, toRef(formData, 'pif'), {
    value: 'id',
  })

  async function validateAndBuildPayload(): Promise<NewNetworkPayload | undefined> {
    const valid = await validate()

    if (!valid || formData.pif === undefined) {
      return undefined
    }

    return {
      ...buildBasePayload(),
      pif: formData.pif,
      ...(typeof formData.vlan === 'number' && { vlan: formData.vlan }),
    }
  }

  return {
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
    interfaceSelectBindings: useSelect(interfacesSelectId, 'pif', () => ({ label: t('interface') })),
    vlanInputBindings: useField('vlan', () => ({ label: t('vlan'), info: t('vlan-default-value-message') })),
    validateAndBuildPayload,
  }
}
