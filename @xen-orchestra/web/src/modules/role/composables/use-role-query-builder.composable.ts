import { useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { getRoleUserIds } from '@/modules/role/utils/xo-role.util.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export type FilterableRole<TRole extends FrontXoRole = FrontXoRole> = TRole & {
  description: string
  usersCount: number
  groupsCount: number
  privilegesCount: number
}

export function useRoleQueryBuilder<TRole extends FrontXoRole>(
  id: string,
  roles: MaybeRefOrGetter<TRole[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const { getGroupsByIds } = useXoGroupCollection()

  const filterableRoles = computed<FilterableRole<TRole>[]>(() =>
    toValue(roles).map(role => ({
      ...role,
      description: role.description ?? '',
      usersCount: getRoleUserIds(role, getGroupsByIds(role.groupIds)).length,
      groupsCount: role.groupIds.length,
      privilegesCount: role.privilegeIds.length,
    }))
  )

  const { items, filter } = useQueryBuilderFilter(id, filterableRoles, options)

  const schema = useQueryBuilderSchema<FilterableRole>({
    '': useStringSchema(t('any-property')),
    name: useStringSchema(t('name')),
    description: useStringSchema(t('description')),
    usersCount: useNumberSchema(t('users')),
    groupsCount: useNumberSchema(t('groups')),
    privilegesCount: useNumberSchema(t('privileges')),
  })

  return { items, filter, schema }
}
