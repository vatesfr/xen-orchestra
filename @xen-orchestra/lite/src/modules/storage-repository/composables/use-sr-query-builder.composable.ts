import { percent } from '@/libs/utils.ts'
import type { XenApiPool, XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/sr-utils.composable.ts'
import { getPbdsConnectionStatus } from '@/modules/storage-repository/utils/pbd.util.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

type SrStatus = ReturnType<typeof getPbdsConnectionStatus>

export type SrFilterableData = XenApiSr & {
  status: SrStatus
  is_default: boolean
  used_space: number
}

export function useSrQueryBuilder(
  id: string,
  rawSrs: MaybeRefOrGetter<XenApiSr[]>,
  {
    pool: rawPool,
    scope: rawScope,
    ...filterOptions
  }: Parameters<typeof useQueryBuilderFilter>[2] & {
    pool: MaybeRefOrGetter<XenApiPool>
    scope: MaybeRefOrGetter<SrScope>
  }
) {
  const { t } = useI18n()

  const { isDefaultSr } = useSrStore().subscribe()
  const { getPbdsInScope } = useGetPbdsInScope()

  const srs = toComputed(rawSrs)
  const pool = toComputed(rawPool)
  const scope = toComputed(rawScope)

  const filterableSrs = computed(() =>
    srs.value.map(
      sr =>
        ({
          ...sr,
          status: getPbdsConnectionStatus(getPbdsInScope(sr, scope.value)),
          is_default: isDefaultSr(sr, pool.value),
          used_space: sr.physical_size === 0 ? 0 : percent(sr.physical_utilisation, sr.physical_size, 0),
        }) satisfies SrFilterableData
    )
  )

  const { items, filter } = useQueryBuilderFilter(id, filterableSrs, filterOptions)

  const schema = useQueryBuilderSchema<SrFilterableData>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    status: useStringSchema(t('status'), {
      [CONNECTION_STATUS.CONNECTED]: t('connected'),
      [CONNECTION_STATUS.PARTIALLY_CONNECTED]: t('partially-connected'),
      [CONNECTION_STATUS.DISCONNECTED]: t('disconnected'),
    } satisfies Record<SrStatus, string>),
    is_default: useBooleanSchema(t('default-storage-repository'), {
      true: t('yes'),
      false: t('no'),
    }),
    name_description: useStringSchema(t('description')),
    type: useStringSchema(t('storage-format')),
    shared: useBooleanSchema(t('access-mode'), {
      true: t('shared'),
      false: t('local'),
    }),
    used_space: useNumberSchema(
      t('used-space'),
      Object.fromEntries([10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(n => [n, t('n-percent', { n })]))
    ),
  })

  return { items, filter, schema }
}
