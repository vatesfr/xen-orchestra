import { type BaseNetworkFormData, useNetworkFormBase } from '@/modules/network/form/use-network-form-base.ts'
import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import type { NewNetworkPayload } from '@/modules/network/jobs/xo-network-create.job.ts'
import { type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useCommonValidationRules } from '@/shared/composables/use-common-validation-rules.composable.ts'
import { useFormValidation } from '@/shared/composables/use-form-validation.composable.ts'
import { useFormBindings } from '@core/packages/form-bindings'
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
  const { requiredRule, outOfRangeRule } = useCommonValidationRules()

  const { useField, useSelect } = useFormBindings(formData)

  const {
    selectedPool,
    buildBasePayload,
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
    validate: validateBase,
  } = useNetworkFormBase(_poolId, formData)

  const { useFieldMetadata, validate } = useFormValidation(formData, {
    errors: {
      onBlur: () => ({
        vlan: {
          outOfRange: outOfRangeRule(0, 4094),
        },
      }),
      onSubmit: () => ({
        pif: { required: requiredRule() },
        vlan: { required: requiredRule() },
      }),
    },
  })

  const { interfacesSelectId } = useNetworkPifSelect(selectedPool, toRef(formData, 'pif'), {
    value: 'id',
  })

  const interfaceSelectBindings = useSelect(
    interfacesSelectId,
    useFieldMetadata('pif', () => ({ label: t('interface') }))
  )
  const vlanInputBindings = useField(
    'vlan',
    useFieldMetadata('vlan', () => ({ label: t('vlan'), required: true }))
  )

  async function validateAndBuildPayload(): Promise<NewNetworkPayload | undefined> {
    const [isBaseValid, isFormValid] = await Promise.all([validateBase(), validate()])

    if (!isBaseValid || !isFormValid) {
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
    nbdCheckboxBindings,
    interfaceSelectBindings,
    vlanInputBindings,
    validateAndBuildPayload,
  }
}
