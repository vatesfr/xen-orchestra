import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useSelectColumn } from '@core/tables/column-definitions/select-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useVmMigrateVdiColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    vdi: useTextColumn({ headerLabel: () => t('vdis'), headerIcon: 'object:vdi' }),
    usedSpace: useLiteralColumn({ headerLabel: () => t('used-space') }),
    fromSr: useTextColumn({ headerLabel: () => t('from-sr'), headerIcon: 'object:sr' }),
    toSr: useSelectColumn({ headerLabel: () => t('to-sr') }),
  }
})
