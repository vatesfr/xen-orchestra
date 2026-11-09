import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoPci } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function usePciSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoPci>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    device_name: useStringSchema(t('device')),
    $host: useStringSchema(t('host')),
    $pool: useStringSchema(t('pool')),
  })
}
