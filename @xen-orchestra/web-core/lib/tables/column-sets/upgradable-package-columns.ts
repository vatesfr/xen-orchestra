import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useButtonColumn } from '@core/tables/column-definitions/button-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const useUpgradablePackageColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTextColumn({ headerLabel: () => t('package') }),
    version: useTextColumn({ headerLabel: () => t('version') }),
    description: useTruncatedTextColumn({ headerLabel: () => t('description') }),
    upgrade: useButtonColumn({ buttonVariant: 'secondary', buttonSize: 'small' }),
  }
})
