import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useLinkOrTextColumn } from '@core/tables/column-definitions/link-or-text-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useI18n } from 'vue-i18n'

export const useBackupLogColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    job: useLinkColumn({ headerLabel: () => t('job') }),
    backupDate: useDateColumn({ headerLabel: () => t('backup-date') }),
    vm: useLinkOrTextColumn({ headerLabel: () => t('vm') }),
    sr: useLinkOrTextColumn({ headerLabel: () => t('sr') }),
    status: useStatusColumn(),
    selectItem: useSelectItemColumn(),
  }
})
