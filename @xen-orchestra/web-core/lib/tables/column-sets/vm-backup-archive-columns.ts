import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column.ts'
import { useLinkOrTextColumn } from '@core/tables/column-definitions/link-or-text-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useI18n } from 'vue-i18n'

export const useVmBackupArchiveColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    date: useDateColumn({ headerLabel: () => t('date') }),
    vm: useLinkOrTextColumn({ headerLabel: () => t('vm') }),
    backupRepository: useLinkOrTextColumn({ headerLabel: () => t('backup-repository') }),
    tags: useTagColumn({ headerLabel: () => t('tags') }),
    selectItem: useSelectItemColumn(),
  }
})
