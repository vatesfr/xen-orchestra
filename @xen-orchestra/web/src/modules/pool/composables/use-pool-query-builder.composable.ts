import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function usePoolQueryBuilder(
  id: string,
  pools: MaybeRefOrGetter<FrontXoPool[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const { items, filter } = useQueryBuilderFilter(id, pools, options)

  const schema = useQueryBuilderSchema<FrontXoPool>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    tags: useStringSchema(t('tags')),
  })

  return { items, filter, schema }
}
