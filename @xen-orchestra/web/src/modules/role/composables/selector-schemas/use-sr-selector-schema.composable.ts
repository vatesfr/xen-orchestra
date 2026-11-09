import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoSr } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useSrSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoSr>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    SR_type: useStringSchema(t('storage-format')),
    shared: useBooleanSchema(t('access-mode'), {
      true: t('shared'),
      false: t('local'),
    }),
    tags: useStringSchema(t('tags')),
    $pool: useStringSchema(t('pool')),
  })
}
