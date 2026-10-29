import type { V2vLaunchSettings } from '@/modules/v2v/types/v2v-launch.type.ts'
import { integer, outOfRange, required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

// The bounds the back end accepts
const MIN_CONCURRENCY = 1

const MAX_CONCURRENCY = 8

// The number input of the concurrency can be cleared
export type V2vLaunchFormData = Omit<V2vLaunchSettings, 'concurrency'> & {
  concurrency: V2vLaunchSettings['concurrency'] | undefined
}

export type V2vLaunchForm = ReturnType<typeof useV2vLaunchForm>

export function useV2vLaunchForm() {
  const { t } = useI18n()

  const formData = reactive<V2vLaunchFormData>({ stopSource: true, stopOnError: true, concurrency: 2 })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        concurrency: { required },
      }),
      onBlur: () => ({
        concurrency: { integer, outOfRange: outOfRange(MIN_CONCURRENCY, MAX_CONCURRENCY) },
      }),
    },
  })

  return {
    formData,
    validate,
    stopSourceCheckboxBindings: useField('stopSource', () => ({
      label: t('v2v:stop-source-vm'),
      info: t('v2v:stop-source-vm-info'),
    })),
    stopOnErrorCheckboxBindings: useField('stopOnError', () => ({
      label: t('stop-on-error'),
      info: t('v2v:stop-on-error-info'),
    })),
    concurrencyInputBindings: useField('concurrency', () => ({ label: t('concurrency'), required: true })),
  }
}
