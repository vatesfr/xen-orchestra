import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoVdiSnapshot } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useVdiSnapshotSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoVdiSnapshot>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    $SR: useStringSchema(t('sr')),
    $snapshot_of: useStringSchema(t('vdi')),
    tags: useStringSchema(t('tags')),
    $pool: useStringSchema(t('pool')),
  })
}
