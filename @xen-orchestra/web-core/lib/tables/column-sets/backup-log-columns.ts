import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useI18n } from 'vue-i18n'

export const useBackupLogsColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    startDate: useDateColumn({ headerLabel: () => t('start-date'), dateStyle: 'short', timeStyle: 'medium' }),
    endDate: useDateColumn({ headerLabel: () => t('end-date'), dateStyle: 'short', timeStyle: 'medium' }),
    duration: useNumberColumn({ headerIcon: 'fa:time', headerLabel: () => t('duration') }),
    status: useStatusColumn(),
    transferSize: useNumberColumn({ headerLabel: () => t('transfer-size') }),
    selectItem: useSelectItemColumn(),
  }
})
