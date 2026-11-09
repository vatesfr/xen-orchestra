import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoBackupRepository } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useBackupRepositorySelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoBackupRepository>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    name: useStringSchema(t('name')),
    url: useStringSchema(t('url')),
    enabled: useBooleanSchema(t('state'), {
      true: t('enabled'),
      false: t('disabled'),
    }),
  })
}
