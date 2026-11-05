import { useI18n } from 'vue-i18n'

export function useJsonSchemaNestedLabel() {
  const { t } = useI18n()

  return (labels: string[]) => labels.reduce((parent, label) => t('json-schema:nested-label', { parent, label }))
}
