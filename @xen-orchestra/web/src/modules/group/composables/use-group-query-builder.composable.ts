import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export type FilterableGroup = FrontXoGroup & { provider: string; usersCount: number; rolesCount: number }

function toFilterableGroup(group: FrontXoGroup): FilterableGroup {
  return {
    ...group,
    provider: group.provider ?? '',
    usersCount: group.users.length,
    rolesCount: group.aclRoleIds.length,
  }
}

export function useGroupQueryBuilder(
  id: string,
  groups: MaybeRefOrGetter<FrontXoGroup[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const filterableGroups = computed(() => toValue(groups).map(group => toFilterableGroup(group)))

  const { items, filter } = useQueryBuilderFilter(id, filterableGroups, options)

  const schema = useQueryBuilderSchema<FilterableGroup>({
    '': useStringSchema(t('any-property')),
    name: useStringSchema(t('name')),
    provider: useStringSchema(t('provider')),
    usersCount: useNumberSchema(t('users')),
    rolesCount: useNumberSchema(t('roles')),
  })

  return { items, filter, schema }
}
