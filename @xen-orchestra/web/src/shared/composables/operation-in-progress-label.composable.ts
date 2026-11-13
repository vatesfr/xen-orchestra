import { createMapper } from '@core/packages/mapper'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export function useOperationInProgressLabel(operationLabels: MaybeRefOrGetter<Record<string, string>>) {
  const { t } = useI18n()

  const getOperationLabel = createMapper<string, string>(
    () => ({ ...toValue(operationLabels), unknown: '' }),
    'unknown'
  )

  return (operation: string | undefined) => {
    if (operation === undefined) {
      return ''
    }

    const operationLabel = getOperationLabel(operation)

    if (operationLabel === '') {
      return ''
    }

    return t('operation-in-progress', { operation: operationLabel })
  }
}
