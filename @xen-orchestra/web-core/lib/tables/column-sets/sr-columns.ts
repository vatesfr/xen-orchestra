import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useProgressBarColumn } from '@core/tables/column-definitions/progress-bar-column.ts'
import { useSelectIdColumn } from '@core/tables/column-definitions/select-id-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useSrColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    storageRepository: useLinkColumn({ headerLabel: () => t('storage-repository') }),
    description: useTextColumn({ headerLabel: () => t('description') }),
    storageFormat: useLiteralColumn({ headerLabel: () => t('storage-format') }),
    accessMode: useLiteralColumn({ headerLabel: () => t('access-mode') }),
    usedSpace: useProgressBarColumn({ headerLabel: () => t('used-space') }),
    selectId: useSelectIdColumn(),
  }
})
