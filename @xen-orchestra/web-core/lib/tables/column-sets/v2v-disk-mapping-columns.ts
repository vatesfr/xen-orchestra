import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useV2vDiskMappingColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    disk: useTextColumn({ headerLabel: () => t('disk'), flexible: true }),
    datastore: useTextColumn({ headerLabel: () => t('datastore') }),
    size: useNumberColumn({ headerLabel: () => t('size') }),
    target: useTextColumn({ headerLabel: () => t('target-sr') }),
    origin: useTextColumn({ headerLabel: () => t('value-from') }),
  }
})
