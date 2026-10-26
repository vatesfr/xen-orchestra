import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import {
  type FormValidationConfig,
  mergeValidationConfigs,
  outOfRange,
  required,
  withMessage,
} from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const MTU_RANGE = { min: 1280, max: 9000 }

// 'nbd': NBD over TLS, 'insecure-nbd': NBD in clear, only on a network dedicated to backups
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

export function useNetworkFormBase<T extends BaseNetworkFormData>(
  _poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>,
  formData: T,
  extraConfig?: FormValidationConfig<T>
) {
  const poolId = toComputed(_poolId)
  const { pools, useGetPoolById } = useXoPoolCollection()

  const { t } = useI18n()

  const baseConfig: FormValidationConfig<BaseNetworkFormData> = {
    errors: {
      onSubmit: () => ({
        pool: { required: withMessage(required, () => t('pool-required')) },
        name: { required: withMessage(required, () => t('name-required')) },
      }),
    },
    warnings: {
      onBlur: () => ({
        mtu: {
          outOfRange: withMessage(outOfRange(MTU_RANGE.min, MTU_RANGE.max), () =>
            t('network-create:warning:mtu-out-of-range', MTU_RANGE)
          ),
        },
      }),
    },
  }

  const { useField, useSelect, useFormSelect, validate } = useValidatedForm(
    formData,
    mergeValidationConfigs(baseConfig, extraConfig)
  )

  const { id: poolSelectId } = useFormSelect('pool', pools, {
    searchable: true,
    required: true,
    option: {
      label: 'name_label',
      value: 'id',
    },
  })

  watch(
    pools,
    newPools => {
      const targetPool = newPools.find(pool => pool.id === poolId.value)

      if (targetPool?.id !== formData.pool) {
        formData.pool = targetPool?.id
      }
    },
    { immediate: true }
  )

  const selectedPool = useGetPoolById(() => formData.pool)

  function buildBasePayload(): BaseNetworkPayload | undefined {
    if (formData.pool === undefined) {
      return undefined
    }

    return {
      poolId: formData.pool,
      name: formData.name,
      ...(formData.description !== '' && { description: formData.description }),
      ...(typeof formData.mtu === 'number' && { mtu: formData.mtu }),
      ...(formData.nbd === 'nbd' && { nbd: true }),
      ...(formData.nbd === 'insecure-nbd' && { insecureNbd: true }),
    }
  }

  return {
    selectedPool,
    validate,
    useField,
    useFormSelect,
    useSelect,
    buildBasePayload,
    poolSelectBindings: useSelect(poolSelectId, () => ({ label: t('pool') })),
    nameInputBindings: useField('name', () => ({ label: t('name'), required: true })),
    descriptionInputBindings: useField('description', () => ({ label: t('description') })),
    mtuInputBindings: useField('mtu', () => ({ label: t('mtu'), info: t('mtu-default-value-message') })),
    nbdRadioBindings: useField('nbd'),
  }
}
