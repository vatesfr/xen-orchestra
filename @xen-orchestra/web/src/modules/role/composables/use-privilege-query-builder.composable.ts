import { usePrivilegeScopeTypeLabels } from '@/modules/role/composables/use-privilege-scope-type-labels.composable.ts'
import type { FrontXoPrivilege } from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import { getPrivilegeScopeType } from '@/modules/role/utils/privilege-scope.util.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export type FilterablePrivilege = FrontXoPrivilege & {
  scope: string
}

export function usePrivilegeQueryBuilder(
  id: string,
  privileges: MaybeRefOrGetter<FrontXoPrivilege[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const scopeTypeLabels = usePrivilegeScopeTypeLabels()

  const filterablePrivileges = computed<FilterablePrivilege[]>(() =>
    toValue(privileges).map(privilege => ({
      ...privilege,
      scope: scopeTypeLabels[getPrivilegeScopeType(privilege.resource, privilege.selector)],
    }))
  )

  const { items, filter } = useQueryBuilderFilter(id, filterablePrivileges, options)

  const schema = useQueryBuilderSchema<FilterablePrivilege>({
    '': useStringSchema(t('any-property')),
    resource: useStringSchema(t('privilege:resource')),
    scope: useStringSchema(t('privilege:scope')),
    action: useStringSchema(t('privilege:action')),
    effect: useStringSchema(t('privilege:effect')),
  })

  return { items, filter, schema }
}
