import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useSrQueryBuilder(
  id: string,
  srs: MaybeRefOrGetter<FrontXoSr[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const { items, filter } = useQueryBuilderFilter(id, srs, options)

  const schema = useQueryBuilderSchema<FrontXoSr>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    SR_type: useStringSchema(t('storage-format')),
    shared: useBooleanSchema(t('access-mode'), {
      true: t('shared'),
      false: t('local'),
    }),
  })

  return { items, filter, schema }
}
