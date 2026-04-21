import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useProgressBarColumn } from '@core/tables/column-definitions/progress-bar-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const useVdiColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    vdi: useLinkColumn({ headerLabel: () => t('vdis') }),
    description: useTruncatedTextColumn({ headerLabel: () => t('description') }),
    usedSpace: useProgressBarColumn({ headerLabel: () => t('used-space') }),
    size: useNumberColumn({ headerLabel: () => t('size') }),
    format: useLiteralColumn({ headerLabel: () => t('format') }),
    actions: useActionColumn({}),
  }
})
