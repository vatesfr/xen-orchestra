import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useI18n } from 'vue-i18n'
import { useDateColumn } from '../column-definitions/date-column'
import { useLinkColumn } from '../column-definitions/link-column'

export const useBackupRunColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    date: useDateColumn({ headerLabel: () => t('network') }),
    BackupArchiveStatus: useStatusColumn({ headerLabel: () => t('device') }),
    BackupJob: useLinkColumn({ headerLabel: () => t('status') }),
  }
})
