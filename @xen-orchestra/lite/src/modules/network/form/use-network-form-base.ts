import type { BaseNewNetworkPayload } from '@/modules/network/jobs/network-create.job.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import {
  type FormValidationConfig,
  mergeValidationConfigs,
  outOfRange,
  required,
  withMessage,
} from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type BaseNetworkFormData = {
  name: string
  description: string
  mtu: number | undefined
  nbd: boolean
}

export function useNetworkFormBase<T extends BaseNetworkFormData>(formData: T, extraConfig?: FormValidationConfig<T>) {
  const { t } = useI18n()

  const baseConfig: FormValidationConfig<BaseNetworkFormData> = {
    errors: {
      onSubmit: () => ({
        name: { required: withMessage(required, () => t('name-required')) },
      }),
    },
    warnings: {
      onBlur: () => ({
        mtu: {
          outOfRange: withMessage(outOfRange(1280, 9000), () =>
            t('network-create:warning:mtu-out-of-range', { min: 1280, max: 9000 })
          ),
        },
      }),
    },
  }

  const { useField, useSelect, validate } = useValidatedForm(formData, mergeValidationConfigs(baseConfig, extraConfig))

  const { pool } = usePoolStore().subscribe()
  const poolInputBindings = computed(() => ({
    label: t('pool'),
    modelValue: pool.value?.name_label ?? '',
    disabled: true,
    required: true,
  }))

  function buildBasePayload(): BaseNewNetworkPayload {
    const payload: BaseNewNetworkPayload = {
      name: formData.name,
    }

    if (formData.description !== '') {
      payload.description = formData.description
    }

    if (typeof formData.mtu === 'number') {
      payload.mtu = formData.mtu
    }

    if (formData.nbd) {
      payload.nbd = formData.nbd
    }

    return payload
  }

  return {
    buildBasePayload,
    poolInputBindings,
    useField,
    useSelect,
    validate,
    nameInputBindings: useField('name', () => ({ label: t('name'), required: true })),
    descriptionInputBindings: useField('description', () => ({ label: t('description') })),
    mtuInputBindings: useField('mtu', () => ({ label: t('mtu'), info: t('mtu-default-value-message') })),
    nbdCheckboxBindings: useField('nbd'),
  }
}
