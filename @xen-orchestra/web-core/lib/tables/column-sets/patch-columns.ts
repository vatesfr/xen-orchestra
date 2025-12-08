import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const usePatchColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTextColumn({ headerLabel: () => t('patch-name') }),
    version: useNumberColumn({ headerLabel: () => t('version') }),
  }
})
