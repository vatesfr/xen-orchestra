import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useI18n } from 'vue-i18n'

export const useBackupLogVmColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    vm: useLinkColumn({ headerLabel: () => t('vm') }),
    virtualSize: useNumberColumn({ headerLabel: () => t('virtual-size') }),
  }
})
