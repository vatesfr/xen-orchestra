import type { PropertyDefinition } from '@core/packages/query-builder/types.ts'
import { useI18n } from 'vue-i18n'

export function useNumberSchema(label: string, values?: Record<string, string>): PropertyDefinition {
  const { t } = useI18n()

  return {
    label,
    operators: {
      greaterThan: { label: '>', values },
      lessThan: { label: '<', values },
      greaterThanOrEqual: { label: '>=', values },
      lessThanOrEqual: { label: '<=', values },
      is: { label: '=', values },
      isNot: { label: '!=', values },
      isEmpty: { label: t('query-builder:operator:empty'), expectValue: false },
      isNotEmpty: { label: t('query-builder:operator:not-empty'), expectValue: false },
    },
  }
}
