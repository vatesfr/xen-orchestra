import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useI18n } from 'vue-i18n'

export const useBackupIssueColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    job: useLinkColumn({ headerLabel: t('backup-job') }),
    lastRuns: useStatusColumn({
      headerLabel: t('last-n-runs', { n: 3 }),
      iconOnly: true,
      progressiveSize: true,
    }),
  }
})
