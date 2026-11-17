import { useNetworkPoolPrefill } from '@/modules/network/form/use-network-pool-prefill.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useFormBindings } from '@core/packages/form-bindings'
import { useFormSelect } from '@core/packages/form-select'
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

export function useNetworkFormBase<T extends BaseNetworkFormData>(
  _poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>,
  formData: T
) {
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

  const { t } = useI18n()

  const { useField, useSelect } = useFormBindings(formData)

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
    selectedPool,
    buildBasePayload,
    poolSelectBindings: useSelect(poolSelectId, () => ({ label: t('pool') })),
    nameInputBindings: useField('name', () => ({ label: t('name'), required: true })),
    descriptionInputBindings: useField('description', () => ({ label: t('description') })),
    mtuInputBindings: useField('mtu', () => ({ label: t('mtu'), info: t('mtu-default-value-message') })),
    nbdRadioBindings: useField('nbd'),
  }
}
