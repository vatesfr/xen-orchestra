import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useProgressBarColumn } from '@core/tables/column-definitions/progress-bar-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column'
import { useI18n } from 'vue-i18n'

export const useSrColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    storageRepository: useLinkColumn({ headerLabel: () => t('storage-repository') }),
    description: useTruncatedTextColumn({ headerLabel: () => t('description') }),
    storageFormat: useLiteralColumn({ headerLabel: () => t('storage-format') }),
    accessMode: useLiteralColumn({ headerLabel: () => t('access-mode') }),
    usedSpace: useProgressBarColumn({ headerLabel: () => t('used-space') }),
    actions: useActionColumn({}),
  }
})
