import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useAdminBackupLogColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    job: useLinkColumn({ headerLabel: () => t('job') }),
    backupDate: useTextColumn({ headerLabel: () => t('backup-date') }),
    vm: useTextColumn({ headerLabel: () => t('vm') }),
    sr: useTextColumn({ headerLabel: () => t('sr') }),
    status: useStatusColumn(),
  }
})
