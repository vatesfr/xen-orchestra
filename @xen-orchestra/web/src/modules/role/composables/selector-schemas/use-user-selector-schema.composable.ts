import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoUser } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useUserSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoUser>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    email: useStringSchema(t('email')),
    username: useStringSchema(t('username')),
    permission: useStringSchema(t('permission'), {
      admin: t('admin'),
      none: t('none'),
    }),
  })
}
