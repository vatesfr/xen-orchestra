import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useProgressBarColumn } from '@core/tables/column-definitions/progress-bar-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useTaskColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTextColumn({ headerLabel: t('name') }),
    host: useLinkColumn({ headerLabel: t('host') }),
    progress: useProgressBarColumn({ headerLabel: t('task.progress') }),
    started: useDateColumn({ headerLabel: t('task.started'), dateStyle: 'short', timeStyle: 'short' }),
    estimatedEnd: useDateColumn({ headerLabel: t('task.estimated-end'), dateStyle: 'short', timeStyle: 'short' }),
  }
})
