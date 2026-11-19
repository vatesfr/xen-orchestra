import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useFlagColumn } from '@core/tables/column-definitions/flag-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectColumn } from '@core/tables/column-definitions/select-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useVmMigrateVifColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    fromNetwork: useTextColumn({ headerLabel: () => t('from-network') }),
    fromDevice: useTextColumn({ headerLabel: () => t('from-device') }),
    fromVlan: useNumberColumn({ headerLabel: () => t('from-vlan') }),
    toNetwork: useSelectColumn({ headerLabel: () => t('to-network') }),
    toVlan: useNumberColumn({ headerLabel: () => t('to-vlan') }),
    flag: useFlagColumn(),
  }
})
