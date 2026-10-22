import { useVmEnhancedData, type VmFilterableData } from '@/modules/vm/composables/use-vm-enhanced-data.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { VM_POWER_STATE } from '@vates/types'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVmQueryBuilder(
  id: string,
  vms: MaybeRefOrGetter<FrontXoVm[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const { filterableVms, getDisplayData } = useVmEnhancedData(vms)

  const { items, filter } = useQueryBuilderFilter(id, filterableVms, options)

  const schema = useQueryBuilderSchema<VmFilterableData>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    power_state: useStringSchema(t('power-state'), {
      [VM_POWER_STATE.RUNNING]: t('status:running'),
      [VM_POWER_STATE.HALTED]: t('status:halted'),
      [VM_POWER_STATE.SUSPENDED]: t('status:suspended'),
      [VM_POWER_STATE.PAUSED]: t('status:paused'),
    }),
    ipAddresses: useStringSchema(t('ip-addresses')),
    'CPUs:number': useNumberSchema(t('vcpus')),
    ramSize: useNumberSchema(t('ram'), {
      [ONE_GB]: t('n-gb', { n: 1 }),
      [2 * ONE_GB]: t('n-gb', { n: 2 }),
      [4 * ONE_GB]: t('n-gb', { n: 4 }),
      [8 * ONE_GB]: t('n-gb', { n: 8 }),
      [16 * ONE_GB]: t('n-gb', { n: 16 }),
      [32 * ONE_GB]: t('n-gb', { n: 32 }),
      [64 * ONE_GB]: t('n-gb', { n: 64 }),
      [128 * ONE_GB]: t('n-gb', { n: 128 }),
      [256 * ONE_GB]: t('n-gb', { n: 256 }),
    }),
    diskSpaceSize: useNumberSchema(t('disk-space'), {
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
    tags: useStringSchema(t('tags')),
  })

  return { items, filter, schema, getDisplayData }
}
