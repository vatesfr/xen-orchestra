import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useBackupJobScheduleColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    id: useTextColumn({ headerLabel: () => t('id'), headerIcon: 'fa:hashtag' }),
    backupJob: useLinkColumn({ headerLabel: () => t('backup-job') }),
    status: useStatusColumn(),
    cronPattern: useTextColumn({ headerLabel: () => t('cron-pattern'), headerIcon: 'fa:clock' }),

    lastThreeRuns: useStatusColumn({
      headerLabel: () => t('last-n-runs', { n: 3 }),
      iconOnly: true,
      progressiveSize: true,
    }),
  }
})
