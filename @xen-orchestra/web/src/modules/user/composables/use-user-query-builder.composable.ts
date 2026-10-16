import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export type FilterableUser = FrontXoUser & { name: string; firstname: string; lastname: string; providers: string }

export function useUserQueryBuilder(
  id: string,
  users: MaybeRefOrGetter<FrontXoUser[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const filterableUsers = computed<FilterableUser[]>(() =>
    toValue(users).map(user => {
      const providers = Object.keys(user.authProviders ?? {})

      return {
        ...user,
        name: user.name ?? '',
        firstname: user.firstname ?? '',
        lastname: user.lastname ?? '',
        providers: providers.length === 0 ? t('local') : providers.join(', '),
      }
    })
  )

  const { items, filter } = useQueryBuilderFilter(id, filterableUsers, options)

  const schema = useQueryBuilderSchema<FilterableUser>({
    '': useStringSchema(t('any-property')),
    name: useStringSchema(t('username')),
    firstname: useStringSchema(t('first-name')),
    lastname: useStringSchema(t('last-name')),
    email: useStringSchema(t('email')),
    providers: useStringSchema(t('providers')),
  })

  return { items, filter, schema }
}
