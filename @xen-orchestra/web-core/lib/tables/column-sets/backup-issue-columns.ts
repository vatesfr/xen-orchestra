import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useI18n } from 'vue-i18n'

export const useBackupIssueColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useLinkColumn({ headerIcon: 'fa:floppy-disk', headerLabel: () => t('job-name') }),
    lastRun: useStatusColumn({ headerIcon: 'fa:square-caret-down', headerLabel: () => t('last') }),
    secondLastRun: useStatusColumn({ headerIcon: 'fa:square-caret-down', headerLabel: () => t('2nd-last') }),
    thirdLastRun: useStatusColumn({ headerIcon: 'fa:square-caret-down', headerLabel: () => t('3rd-last') }),
  }
})
