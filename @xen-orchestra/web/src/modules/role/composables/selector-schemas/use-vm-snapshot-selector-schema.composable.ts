import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoVmSnapshot } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useVmSnapshotSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoVmSnapshot>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    $snapshot_of: useStringSchema(t('vm')),
    tags: useStringSchema(t('tags')),
    $pool: useStringSchema(t('pool')),
  })
}
