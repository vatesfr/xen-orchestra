import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useCommonValidationRules } from '@/shared/composables/use-common-validation-rules.composable.ts'
import { useFormValidation } from '@/shared/composables/use-form-validation.composable.ts'
import { useFormBindings } from '@core/packages/form-bindings'
import { useFormSelect } from '@core/packages/form-select'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type BaseNetworkFormData = {
  pool: FrontXoPool['id'] | undefined
  name: string
  description: string
  mtu: number | undefined
  nbd: boolean
}

export type BaseNetworkPayload = {
  poolId: FrontXoPool['id']
  name: string
  description?: string
  mtu?: number
  nbd?: boolean
}

export function useNetworkFormBase<T extends BaseNetworkFormData>(
  _poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>,
  formData: T
) {
  const poolId = toComputed(_poolId)
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

  const { t } = useI18n()

  const { requiredRule, outOfRangeRule } = useCommonValidationRules()

  const { useField, useSelect } = useFormBindings(formData)

  const { useFieldMetadata, validate } = useFormValidation(formData, {
    errors: {
      onSubmit: () => ({
        pool: { required: requiredRule() },
        name: { required: requiredRule() },
      }),
    },
    warnings: {
      onBlur: () => ({
        mtu: { outOfRange: outOfRangeRule(1280, 9000) },
      }),
    },
  })

  function buildBasePayload(): BaseNetworkPayload {
    return {
      poolId: formData.pool!,
      name: formData.name,
      ...(formData.description !== '' && { description: formData.description }),
      ...(typeof formData.mtu === 'number' && { mtu: formData.mtu }),
      ...(formData.nbd && { nbd: formData.nbd }),
    }
  }

  const poolSelectBindings = useSelect(
    poolSelectId,
    useFieldMetadata('pool', () => ({ label: t('pool') }))
  )
  const nameInputBindings = useField(
    'name',
    useFieldMetadata('name', () => ({ label: t('name'), required: true }))
  )
  const descriptionInputBindings = useField('description', () => ({ label: t('description') }))
  const mtuInputBindings = useField(
    'mtu',
    useFieldMetadata('mtu', () => ({ label: t('mtu'), info: t('mtu-default-value-message') }))
  )
  const nbdCheckboxBindings = useField('nbd')

  return {
    selectedPool,
    buildBasePayload,
    validate,
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
  }
}
