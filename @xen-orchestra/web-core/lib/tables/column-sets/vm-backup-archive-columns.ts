import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useNumberColumn } from '@core/tables/column-definitions/number-column'
import { useI18n } from 'vue-i18n'

export const useBackuparchiveColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    date: useDateColumn({ headerLabel: () => t('network') }),
    backupRepository: useLinkColumn({ headerLabel: () => t('backup-repository') }),
    sizeOnDisk: useNumberColumn({ headerLabel: () => t('size-on-disk') }),
  }
})
