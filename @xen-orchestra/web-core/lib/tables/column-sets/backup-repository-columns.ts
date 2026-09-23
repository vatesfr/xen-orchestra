import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useBackupRepositoryColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    backupRepository: useLinkColumn({ headerLabel: () => t('backup-repository') }),
    status: useStatusColumn({ headerLabel: () => t('status') }),
    type: useLiteralColumn({ headerLabel: () => t('type') }),
    proxy: useTextColumn({ headerLabel: () => t('proxy') }),
    selectItem: useSelectItemColumn(),
  }
})
