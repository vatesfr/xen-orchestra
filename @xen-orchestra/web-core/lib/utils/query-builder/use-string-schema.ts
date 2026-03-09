import type { PropertyDefinition } from '@core/packages/query-builder/types.ts'
import { useI18n } from 'vue-i18n'

export function useStringSchema(label: string, values?: Record<string, string>): PropertyDefinition {
  const { t } = useI18n()

  if (values !== undefined) {
    return {
      label,
      operators: {
        is: { label: t('query-builder:operator:is'), values },
        isNot: { label: t('query-builder:operator:is-not'), values },
        isEmpty: { label: t('query-builder:operator:empty'), expectValue: false },
        isNotEmpty: { label: t('query-builder:operator:not-empty'), expectValue: false },
      },
    }
  }

  return {
    label,
    operators: {
      contains: { label: t('query-builder:operator:contains') },
      doesNotContain: { label: t('query-builder:operator:not-contain') },
      is: { label: t('query-builder:operator:is') },
      isNot: { label: t('query-builder:operator:is-not') },
      startsWith: { label: t('query-builder:operator:starts-with') },
      endsWith: { label: t('query-builder:operator:ends-with') },
      isEmpty: { label: t('query-builder:operator:empty'), expectValue: false },
      isNotEmpty: { label: t('query-builder:operator:not-empty'), expectValue: false },
      matchesRegex: { label: t('query-builder:operator:matches-regex') },
      doesNotMatchRegex: { label: t('query-builder:operator:not-match-regex') },
      matchesGlob: { label: t('query-builder:operator:matches-glob') },
      doesNotMatchGlob: { label: t('query-builder:operator:not-match-glob') },
    },
  }
}
