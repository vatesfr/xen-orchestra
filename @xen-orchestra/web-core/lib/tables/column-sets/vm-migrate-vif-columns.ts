import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useSelectColumn } from '@core/tables/column-definitions/select-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useVmMigrateVifColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    fromNetwork: useTextColumn({ headerLabel: () => t('from-network'), headerIcon: 'object:network' }),
    device: useLiteralColumn({ headerLabel: () => t('device') }),
    toNetwork: useSelectColumn({ headerLabel: () => t('to-network') }),
    toVlan: useLiteralColumn({ headerLabel: () => t('to-vlan') }),
  }
})
