import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useCheckboxColumn } from '@core/tables/column-definitions/checkbox-column.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column.ts'
import { useLinkOrTextColumn } from '@core/tables/column-definitions/link-or-text-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useI18n } from 'vue-i18n'

export const useBackupArchiveVmColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    checkbox: useCheckboxColumn(),
    vm: useLinkOrTextColumn({ headerLabel: () => t('vm') }),
    backups: useNumberColumn({ headerLabel: () => t('backups') }),
    lastBackupDate: useDateColumn({
      headerLabel: () => t('last-backup-date'),
      dateStyle: 'short',
      timeStyle: 'medium',
    }),
  }
})
