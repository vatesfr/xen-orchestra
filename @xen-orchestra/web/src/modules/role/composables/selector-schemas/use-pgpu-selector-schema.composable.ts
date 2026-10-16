import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoPgpu } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function usePgpuSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoPgpu>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    $host: useStringSchema(t('host')),
    $pool: useStringSchema(t('pool')),
  })
}
