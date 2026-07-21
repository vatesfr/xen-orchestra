import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { type BaseNetworkFormData, useNetworkFormBase } from '@/modules/network/form/use-network-form-base.ts'
import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import type { NewNetworkPayload } from '@/modules/network/jobs/network-create.job.ts'
import { type FormValidationConfig, outOfRange, required, withMessage } from '@core/packages/form-validation'
import { reactive, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

export type NewNetworkFormData = BaseNetworkFormData & {
  pifRef: XenApiPif['$ref'] | undefined
  vlan: number | undefined
}

export function useNewNetworkForm() {
  const formData = reactive<NewNetworkFormData>({
    name: '',
    description: '',
    mtu: undefined,
    nbd: false,
    pifRef: undefined,
    vlan: undefined,
  })

  const { t } = useI18n()

  const extraConfig: FormValidationConfig<NewNetworkFormData> = {
    errors: {
      onSubmit: () => ({
        pifRef: { required: withMessage(required, () => t('interface-required')) },
        vlan: { required: withMessage(required, () => t('vlan-required')) },
      }),
    },
    warnings: {
      onBlur: () => ({
        vlan: {
          outOfRange: withMessage(outOfRange(0, 4094), () =>
            t('network-create:warning:vlan-out-of-range', { max: 4094 })
          ),
        },
      }),
    },
  }

  const {
    buildBasePayload,
    poolInputBindings,
    useField,
    useSelect,
    validate,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
  } = useNetworkFormBase(formData, extraConfig)

  const { interfacesSelectId } = useNetworkPifSelect(toRef(formData, 'pifRef'), { value: '$ref' })

  async function validateAndBuildPayload(): Promise<NewNetworkPayload | undefined> {
    const valid = await validate()

    if (!valid || formData.pifRef === undefined || formData.vlan === undefined) {
      return undefined
    }

    return {
      ...buildBasePayload(),
      pifRef: formData.pifRef,
      vlan: formData.vlan,
    }
  }

  return {
    poolInputBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
    interfaceSelectBindings: useSelect(interfacesSelectId, 'pifRef', () => ({ label: t('interface') })),
    vlanInputBindings: useField('vlan', () => ({ label: t('vlan'), required: true, info: t('vlan-no-default') })),
    validateAndBuildPayload,
  }
}
