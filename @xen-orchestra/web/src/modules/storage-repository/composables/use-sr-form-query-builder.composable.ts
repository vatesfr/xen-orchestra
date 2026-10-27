import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export type SrFormFilterableData = FrontXoSr & {
  poolName: string
}

export function useSrFormFilterableData(rawSrs: MaybeRefOrGetter<FrontXoSr[]>) {
  const srs = toComputed(rawSrs)

  const { getPoolById } = useXoPoolCollection()

  return computed<SrFormFilterableData[]>(() =>
    srs.value.map(sr => ({
      ...sr,
      poolName: getPoolById(sr.$pool)?.name_label ?? '',
    }))
  )
}

export function useSrFormQueryBuilder(
  id: string,
  rawSrs: MaybeRefOrGetter<FrontXoSr[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const filterableSrs = useSrFormFilterableData(rawSrs)

  const { items, filter } = useQueryBuilderFilter(id, filterableSrs, options)

  const schema = useQueryBuilderSchema<SrFormFilterableData>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    poolName: useStringSchema(t('pool')),
    SR_type: useStringSchema(t('storage-format')),
    shared: useBooleanSchema(t('access-mode'), {
      true: t('shared'),
      false: t('local'),
    }),
  })

  return { items, filter, schema }
}
