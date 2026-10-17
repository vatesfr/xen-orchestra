import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useFlagColumn } from '@core/tables/column-definitions/flag-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectColumn } from '@core/tables/column-definitions/select-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useVmMigrateVdiColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    vdi: useTextColumn({ headerLabel: () => t('vdi') }),
    usedSpace: useNumberColumn({ headerLabel: () => t('used-space') }),
    fromSr: useTextColumn({ headerLabel: () => t('from-sr') }),
    toSr: useSelectColumn({ headerLabel: () => t('to-sr') }),
    flag: useFlagColumn(),
  }
})
