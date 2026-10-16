import { useVmPowerStateSchema } from '@/modules/role/composables/selector-schemas/use-vm-power-state-schema.composable.ts'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useVmSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoVm>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    power_state: useVmPowerStateSchema(),
    tags: useStringSchema(t('tags')),
    $pool: useStringSchema(t('pool')),
  })
}
