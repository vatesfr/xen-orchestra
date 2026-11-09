import { useVmPowerStateSchema } from '@/modules/role/composables/selector-schemas/use-vm-power-state-schema.composable.ts'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoVmController } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useVmControllerSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoVmController>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    name_label: useStringSchema(t('name')),
    power_state: useVmPowerStateSchema(),
    $pool: useStringSchema(t('pool')),
  })
}
