import type { V2vLaunchSettings } from '@/modules/v2v/types/v2v-launch.type.ts'
import { integer, outOfRange, required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

// The bounds the back end accepts
const MIN_CONCURRENCY = 1

const MAX_CONCURRENCY = 8

export function useV2vLaunchForm() {
  const { t } = useI18n()

  const formData = reactive<V2vLaunchSettings>({ stopSource: true, stopOnError: true, concurrency: 2 })

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
    stopSourceToggleBindings: useField('stopSource', () => ({ label: t('v2v:stop-source-vm') })),
    stopOnErrorToggleBindings: useField('stopOnError', () => ({ label: t('stop-on-error') })),
    concurrencyInputBindings: useField('concurrency', () => ({ label: t('concurrency'), required: true })),
  }
}
