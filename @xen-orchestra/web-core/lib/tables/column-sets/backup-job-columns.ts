import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useBackupJobColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    backupJob: useLinkColumn({ headerLabel: () => t('backup-job') }),
    type: useTextColumn({ headerLabel: () => t('type') }),
    mode: useTextColumn({ headerLabel: () => t('mode') }),
    lastRuns: useStatusColumn({
      headerLabel: () => t('last-n-runs', { n: 3 }),
      iconOnly: true,
      progressiveSize: true,
    }),
    healthCheck: useStatusColumn({ headerLabel: () => t('health-check') }),
    selectItem: useSelectItemColumn(),
  }
})
