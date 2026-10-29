import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useCheckboxColumn } from '@core/tables/column-definitions/checkbox-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const usePoolColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    checkbox: useCheckboxColumn(),
    pool: useLinkColumn({ headerLabel: () => t('pool') }),
    description: useTruncatedTextColumn({ headerLabel: () => t('description') }),
    tags: useTagColumn({ headerLabel: () => t('tags') }),
  }
})
