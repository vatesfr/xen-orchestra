import type { SrAllocationStrategy } from '@/libs/sr.ts'
import { percent } from '@/libs/utils.ts'
import type { XenApiPool, XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/sr-utils.composable.ts'
import { getPbdsConnectionStatus } from '@/modules/storage-repository/utils/pbd.util.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePbdStore } from '@/stores/xen-api/pbd.store.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import { useVdiStore } from '@/stores/xen-api/vdi.store.ts'
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

const ONE_GB = 1024 ** 3

type SrStatus = ReturnType<typeof getPbdsConnectionStatus>

export type SrFilterableData = XenApiSr & {
  status: SrStatus
  is_default: boolean
  used_space: number
  provisioning: SrAllocationStrategy
  is_ha: boolean
  host_names: string[]
  vdis_count: number
  snapshot_vdis_count: number
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

  const { isDefaultSr, isHaSr, getAllocationStrategy } = useSrStore().subscribe()
  const { getPbdsInScope } = useGetPbdsInScope()
  const { getPbdsForSr } = usePbdStore().subscribe()
  const { getByOpaqueRef: getHostByOpaqueRef } = useHostStore().subscribe()
  const { getByOpaqueRef: getVdiByOpaqueRef } = useVdiStore().subscribe()

  const srs = toComputed(rawSrs)
  const pool = toComputed(rawPool)
  const scope = toComputed(rawScope)

  const filterableSrs = computed(() =>
    srs.value.map(sr => {
      const vdis = sr.VDIs.map(vdiRef => getVdiByOpaqueRef(vdiRef)).filter(vdi => vdi !== undefined)
      const vdisCount = vdis.filter(vdi => !vdi.is_a_snapshot).length

      return {
        ...sr,
        status: getPbdsConnectionStatus(getPbdsInScope(sr, scope.value)),
        is_default: isDefaultSr(sr, pool.value),
        used_space: sr.physical_size === 0 ? 0 : percent(sr.physical_utilisation, sr.physical_size, 0),
        provisioning: getAllocationStrategy(sr) ?? 'unknown',
        is_ha: isHaSr(sr, pool.value),
        host_names: getPbdsForSr(sr.$ref).map(pbd => getHostByOpaqueRef(pbd.host)?.name_label ?? ''),
        vdis_count: vdisCount,
        snapshot_vdis_count: vdis.length - vdisCount,
      } satisfies SrFilterableData
    })
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
    tags: useStringSchema(t('tags')),
    // "thin" and "thick" are technical names, not translated
    provisioning: useStringSchema(t('provisioning'), {
      thin: 'Thin',
      thick: 'Thick',
      unknown: t('unknown'),
    } satisfies Record<SrAllocationStrategy, string>),
    is_ha: useBooleanSchema(t('high-availability'), {
      true: t('enabled'),
      false: t('disabled'),
    }),
    physical_size: useNumberSchema(
      t('total-space'),
      Object.fromEntries([64, 128, 256, 512, 1024, 2048, 4096].map(n => [n * ONE_GB, t('n-gb', { n })]))
    ),
    host_names: useStringSchema(t('hosts')),
    vdis_count: useNumberSchema(t('vdis')),
    snapshot_vdis_count: useNumberSchema(t('snapshot-vdis')),
    uuid: useStringSchema(t('uuid')),
  })

  return { items, filter, schema }
}
