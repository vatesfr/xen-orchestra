import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoAclBasePrivilege } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useAclPrivilegeSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoAclBasePrivilege>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    resource: useStringSchema(t('privilege:resource')),
    action: useStringSchema(t('privilege:action')),
    effect: useStringSchema(t('privilege:effect'), {
      allow: t('allow'),
      deny: t('deny'),
    }),
    selector: useStringSchema(t('privilege:selector')),
    roleId: useStringSchema(t('role')),
  })
}
