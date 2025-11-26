import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useVmColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    vm: useLinkColumn({ headerLabel: () => t('host') }),
    description: useTextColumn({ headerLabel: () => t('description') }),
  }
})
