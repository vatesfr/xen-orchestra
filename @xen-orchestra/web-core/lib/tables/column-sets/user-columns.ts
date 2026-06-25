import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const useUserColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTruncatedTextColumn({ headerLabel: () => t('name') }),
    email: useTruncatedTextColumn({ headerLabel: () => t('email') }),
    provider: useTruncatedTextColumn({ headerLabel: () => t('provider') }),
    actions: useActionColumn({}),
  }
})
