import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useButtonIconColumn } from '@core/tables/column-definitions/button-icon-column.ts'
import { useInputColumn } from '@core/tables/column-definitions/input-column.ts'
import { useSelectColumn } from '@core/tables/column-definitions/select-column.ts'
import { useI18n } from 'vue-i18n'

export const useNewVmNetworkColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    interface: useSelectColumn({
      headerLabel: () => t('interfaces'),
      headerIcon: 'fa:network-wired',
    }),

    mac: useInputColumn({
      headerLabel: () => t('mac-addresses'),
      headerIcon: 'fa:at',
      placeholder: () => t('auto-generated'),
    }),

    remove: useButtonIconColumn({ buttonIcon: 'fa:trash' }),
  }
})
