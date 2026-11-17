import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { t } from '@/test/i18n.ts'

// Stands in for `useJsonSchemaItemLabel` in the utils, which take the label builder as an option
export function getItemLabel(index: number, itemSchema: JsonSchema) {
  return `${itemSchema.title ?? 'Item'} ${index + 1}`
}

export function getNumberedItemLabel(n: number, label = t('item')) {
  return t('json-schema:numbered-item', { label, n })
}
