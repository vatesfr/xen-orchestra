import { useNetworkPoolPrefill } from '@/modules/network/form/use-network-pool-prefill.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useFormSelect } from '@core/packages/form-select'
import {
  type FormValidationConfig,
  mergeValidationConfigs,
  required,
  withMessage,
} from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { type MaybeRefOrGetter, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

export type NetworkNbdMode = 'none' | 'nbd' | 'insecure-nbd'

export type BaseNetworkFormData = {
  pool: FrontXoPool['id'] | undefined
  name: string
  description: string
  mtu: number | undefined
  nbd: NetworkNbdMode
}

export type BaseNetworkPayload = {
  poolId: FrontXoPool['id']
  name: string
  description?: string
  mtu?: number
  nbd?: boolean
  insecureNbd?: boolean
}

export function useNetworkFormBase<T extends BaseNetworkFormData & Record<string, unknown>>(
  _poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>,
  formData: T,
  extraConfig?: FormValidationConfig<T>
) {
  const { t } = useI18n()

  const baseConfig: FormValidationConfig<BaseNetworkFormData> = {
    errors: {
      onSubmit: () => ({
        pool: { required: withMessage(required, () => t('pool-required')) },
        name: { required: withMessage(required, () => t('name-required')) },
      }),
    },
  }

  const { useField, useSelect, validate } = useValidatedForm(formData, mergeValidationConfigs(baseConfig, extraConfig))

  const { pools, useGetPoolById } = useXoPoolCollection()

  const { id: poolSelectId } = useFormSelect(pools, {
    searchable: true,
    required: true,
    model: toRef(formData, 'pool'),
    option: {
      label: 'name_label',
      value: 'id',
    },
  })

  const baseFormData: BaseNetworkFormData = formData

  useNetworkPoolPrefill(_poolId, toRef(baseFormData, 'pool'))

  const selectedPool = useGetPoolById(() => formData.pool)

  function buildBasePayload(): BaseNetworkPayload {
    return {
      poolId: formData.pool!,
      name: formData.name,
      ...(formData.description !== '' && { description: formData.description }),
      ...(typeof formData.mtu === 'number' && { mtu: formData.mtu }),
      ...(formData.nbd === 'nbd' && { nbd: true }),
      ...(formData.nbd === 'insecure-nbd' && { insecureNbd: true }),
    }
  }

  return {
    useField,
    useSelect,
    validate,
    selectedPool,
    buildBasePayload,
    poolSelectBindings: useSelect(poolSelectId, 'pool', () => ({ label: t('pool') })),
    nameInputBindings: useField('name', () => ({ label: t('name'), required: true })),
    descriptionInputBindings: useField('description', () => ({ label: t('description') })),
    mtuInputBindings: useField('mtu', () => ({ label: t('mtu'), info: t('mtu-default-value-message') })),
    nbdRadioBindings: useField('nbd'),
  }
}
