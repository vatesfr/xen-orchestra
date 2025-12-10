import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useI18n } from 'vue-i18n'
import { useDateColumn } from '../column-definitions/date-column'
import { useLinkColumn } from '../column-definitions/link-column'
import { useNumberColumn } from '../column-definitions/number-column'

export const useBackuparchiveColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    date: useDateColumn({ headerLabel: () => t('network') }),
    BackupRepository: useLinkColumn({ headerLabel: () => t('backup-repository') }),
    sizeOnDisk: useNumberColumn({ headerLabel: () => t('size-on-disk') }),
  }
})
