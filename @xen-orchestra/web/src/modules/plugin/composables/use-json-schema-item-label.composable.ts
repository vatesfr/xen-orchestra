import type { GetItemLabel } from '@/modules/plugin/utils/json-schema.util.ts'
import { useI18n } from 'vue-i18n'

export function useJsonSchemaItemLabel(): GetItemLabel {
  const { t } = useI18n()

  return (index, itemSchema) => t('json-schema:numbered-item', { label: itemSchema.title ?? t('item'), n: index + 1 })
}
