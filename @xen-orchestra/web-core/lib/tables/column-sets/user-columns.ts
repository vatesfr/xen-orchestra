import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const useUserColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    username: useTruncatedTextColumn({ headerLabel: () => t('username') }),
    email: useTruncatedTextColumn({ headerLabel: () => t('email') }),
    provider: useTruncatedTextColumn({ headerLabel: () => t('providers') }),
    selectItem: useSelectItemColumn(),
  }
})
