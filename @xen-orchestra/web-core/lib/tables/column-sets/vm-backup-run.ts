import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useI18n } from 'vue-i18n'

export const useBackupRunColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    date: useDateColumn({ headerLabel: () => t('network') }),
    backupArchiveStatus: useStatusColumn({ headerLabel: () => t('device') }),
    backupJob: useLinkColumn({ headerLabel: () => t('status') }),
  }
})
