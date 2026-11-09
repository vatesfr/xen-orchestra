import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoAclRole } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useAclRoleSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoAclRole>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    name: useStringSchema(t('name')),
    description: useStringSchema(t('description')),
  })
}
