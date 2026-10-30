import { getApiErrorMessage } from '@/shared/utils/api-error.util.ts'
import { useI18n } from 'vue-i18n'

export function useApiErrorMessage() {
  const { t } = useI18n()

  function getErrorMessage(error: unknown): string {
    return getApiErrorMessage(error) ?? t('error')
  }

  return { getErrorMessage }
}
