import { percent } from '@/libs/utils.ts'
import { VBD_MODE } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiVbd, XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import { getVdiFormat } from '@/modules/vdi/utils/vdi.util.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { getConnectionStatus } from '@core/utils/connection.util.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

const ONE_GB = 1024 ** 3

type VdiStatus = ReturnType<typeof getConnectionStatus>

export type VdiFilterableData = XenApiVdi & {
  format: string
  used_space: number
  status: VdiStatus
  device: string | undefined
  sr_name: string
  is_read_only: boolean
  is_bootable: boolean
}

export function useVdiQueryBuilder(
  id: string,
  rawVdis: MaybeRefOrGetter<XenApiVdi[]>,
  {
    vbds: rawVbds,
    ...filterOptions
  }: Parameters<typeof useQueryBuilderFilter>[2] & { vbds: MaybeRefOrGetter<XenApiVbd[]> }
) {
  const { t } = useI18n()

  const { getByOpaqueRef: getSrByOpaqueRef } = useSrStore().subscribe()

  const vdis = toComputed(rawVdis)
  const vbds = toComputed(rawVbds)

  const filterableVdis = computed(() =>
    vdis.value.map(vdi => {
      const vdiVbds = vbds.value.filter(vbd => vbd.VDI === vdi.$ref)
      const vbd = vdiVbds[0]

      return {
        ...vdi,
        format: getVdiFormat(vdi.sm_config['image-format']),
        used_space: vdi.virtual_size === 0 ? 0 : percent(vdi.physical_utilisation, vdi.virtual_size, 0),
        status: getConnectionStatus(vdiVbds.map(vdiVbd => vdiVbd.currently_attached)),
        device: vbd?.device,
        sr_name: getSrByOpaqueRef(vdi.SR)?.name_label ?? '',
        is_read_only: vbd?.mode === VBD_MODE.RO,
        is_bootable: vbd?.bootable ?? false,
      } satisfies VdiFilterableData
    })
  )

  const { items, filter } = useQueryBuilderFilter(id, filterableVdis, filterOptions)

  const schema = useQueryBuilderSchema<VdiFilterableData>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    used_space: useNumberSchema(
      t('used-space'),
      Object.fromEntries([10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(n => [n, t('n-percent', { n })]))
    ),
    virtual_size: useNumberSchema(t('size'), {
      [ONE_GB]: t('n-gb', { n: 1 }),
      [2 * ONE_GB]: t('n-gb', { n: 2 }),
      [4 * ONE_GB]: t('n-gb', { n: 4 }),
      [8 * ONE_GB]: t('n-gb', { n: 8 }),
      [16 * ONE_GB]: t('n-gb', { n: 16 }),
      [32 * ONE_GB]: t('n-gb', { n: 32 }),
      [64 * ONE_GB]: t('n-gb', { n: 64 }),
      [128 * ONE_GB]: t('n-gb', { n: 128 }),
      [256 * ONE_GB]: t('n-gb', { n: 256 }),
      [512 * ONE_GB]: t('n-gb', { n: 512 }),
    }),
    // technical names, not translated
    format: useStringSchema(t('format'), {
      VHD: 'VHD',
      QCOW2: 'QCOW2',
    }),
    status: useStringSchema(t('status'), {
      [CONNECTION_STATUS.CONNECTED]: t('connected'),
      [CONNECTION_STATUS.PARTIALLY_CONNECTED]: t('partially-connected'),
      [CONNECTION_STATUS.DISCONNECTED]: t('disconnected'),
    } satisfies Record<VdiStatus, string>),
    device: useStringSchema(t('device')),
    sr_name: useStringSchema(t('storage')),
    is_read_only: useBooleanSchema(t('read-only'), {
      true: t('enabled'),
      false: t('disabled'),
    }),
    cbt_enabled: useBooleanSchema(t('change-block-tracking'), {
      true: t('enabled'),
      false: t('disabled'),
    }),
    is_bootable: useBooleanSchema(t('bootable'), {
      true: t('enabled'),
      false: t('disabled'),
    }),
    tags: useStringSchema(t('tags')),
    uuid: useStringSchema(t('uuid')),
  })

  return { items, filter, schema }
}
