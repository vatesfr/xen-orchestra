import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectColumn } from '@core/tables/column-definitions/select-column.ts'
import { useI18n } from 'vue-i18n'

export const useVmBackupArchiveRestoreDiskColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    disk: useLiteralColumn({ headerLabel: () => t('disk') }),
    size: useNumberColumn({ headerLabel: () => t('virtual-size') }),
    action: useSelectColumn({ headerLabel: () => t('action') }),
    storage: useLiteralColumn({ headerLabel: () => t('storage') }),
  }
})
