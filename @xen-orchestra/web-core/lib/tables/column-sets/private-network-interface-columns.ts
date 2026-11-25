import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useButtonIconColumn } from '@core/tables/column-definitions/button-icon-column.ts'
import { useSelectColumn } from '@core/tables/column-definitions/select-column.ts'
import { useI18n } from 'vue-i18n'

export const usePrivateNetworkInterfaceColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    pool: useSelectColumn({
      headerLabel: () => t('pool'),
    }),

    pif: useSelectColumn({
      headerLabel: () => t('pif'),
      optionIcon: 'object:network',
    }),

    remove: useButtonIconColumn({ buttonIcon: 'action:delete', buttonAccent: 'danger' }),
  }
})
