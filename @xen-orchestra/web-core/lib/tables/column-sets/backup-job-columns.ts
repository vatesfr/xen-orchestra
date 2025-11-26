import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useI18n } from 'vue-i18n'

export const useBackupJobColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    job: useLinkColumn({ headerLabel: t('job-name') }),
    mode: useTagColumn({ headerLabel: t('mode') }),
    lastRuns: useStatusColumn({
      headerLabel: t('last-n-runs', { n: 3 }),
      iconOnly: true,
      progressiveSize: true,
    }),
    schedules: useNumberColumn({ headerLabel: t('total-schedules') }),
    selectItem: useSelectItemColumn(),
  }
})
