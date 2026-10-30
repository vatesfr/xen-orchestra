import type { XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import { getVdiFormat } from '@/modules/vdi/utils/vdi.util.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

const ONE_GB = 1024 ** 3

export type VdiFilterableData = XenApiVdi & {
  format: string
}

export function useVdiQueryBuilder(
  id: string,
  rawVdis: MaybeRefOrGetter<XenApiVdi[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const vdis = toComputed(rawVdis)

  const filterableVdis = computed(() =>
    vdis.value.map(vdi => ({ ...vdi, format: getVdiFormat(vdi.sm_config['image-format']) }) satisfies VdiFilterableData)
  )

  const { items, filter } = useQueryBuilderFilter(id, filterableVdis, options)

  const schema = useQueryBuilderSchema<VdiFilterableData>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
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
  })

  return { items, filter, schema }
}
