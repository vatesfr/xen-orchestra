import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const useSnapshotColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useLinkColumn({ headerLabel: () => t('name') }),
    description: useTruncatedTextColumn({ headerLabel: () => t('description') }),
    creationDate: useDateColumn({ headerLabel: () => t('creation-date'), dateStyle: 'short', timeStyle: 'medium' }),
    trigger: useLinkColumn({ headerLabel: () => t('trigger'), headerIcon: 'fa:square-caret-down' }),
    selectItem: useSelectItemColumn(),
  }
})
