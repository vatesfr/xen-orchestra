import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useButtonIconColumn } from '@core/tables/column-definitions/button-icon-column.ts'
import { useInputColumn } from '@core/tables/column-definitions/input-column.ts'
import { useRankColumn } from '@core/tables/column-definitions/rank-column.ts'
import { useSelectColumn } from '@core/tables/column-definitions/select-column.ts'
import { useI18n } from 'vue-i18n'

export const useNewVmNetworkColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    rank: useRankColumn({ highlighted: true }),

    interface: useSelectColumn({
      headerLabel: () => t('interfaces'),
      optionIcon: option => option.properties.icon,
    }),

    mac: useInputColumn({
      headerLabel: () => t('mac-addresses'),
      placeholder: () => t('auto-generated'),
    }),

    remove: useButtonIconColumn({ buttonIcon: 'fa:trash', buttonAccent: 'danger' }),
  }
})
