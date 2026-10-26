import { type BaseNetworkFormData, useNetworkFormBase } from '@/modules/network/form/use-network-form-base.ts'
import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import type { NewNetworkPayload } from '@/modules/network/jobs/xo-network-create.job.ts'
import { type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { type FormValidationConfig, outOfRange, required, withMessage } from '@core/packages/form-validation'
import { type MaybeRefOrGetter, reactive, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const VLAN_RANGE = { min: 0, max: 4094 }

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

  const extraConfig: FormValidationConfig<NewNetworkFormData> = {
    errors: {
      onSubmit: () => ({
        pif: { required: withMessage(required, () => t('interface-required')) },
        vlan: { required: withMessage(required, () => t('vlan-required')) },
      }),
    },
    warnings: {
      onBlur: () => ({
        vlan: {
          outOfRange: withMessage(outOfRange(VLAN_RANGE.min, VLAN_RANGE.max), () =>
            t('network-create:warning:vlan-out-of-range', VLAN_RANGE)
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
    nbdRadioBindings,
  } = useNetworkFormBase(_poolId, formData, extraConfig)

  const { interfacesSelectId } = useNetworkPifSelect(selectedPool, toRef(formData, 'pif'), {
    value: 'id',
  })

  async function validateAndBuildPayload(): Promise<NewNetworkPayload | undefined> {
    const valid = await validate()

    if (!valid) {
      return undefined
    }

    const basePayload = buildBasePayload()

    if (formData.pif === undefined || formData.vlan === undefined || basePayload === undefined) {
      return undefined
    }

    return {
      ...basePayload,
      pif: formData.pif,
      vlan: formData.vlan,
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
