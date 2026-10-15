import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import { useI18n } from 'vue-i18n'

export function useJsonSchemaItemLabel() {
  const { t } = useI18n()

  return (index: number, itemSchema: JsonSchema) =>
    t('json-schema:numbered-item', { label: itemSchema.title ?? t('item'), n: index + 1 })
}
