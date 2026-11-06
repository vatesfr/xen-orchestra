import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useCheckboxColumn } from '@core/tables/column-definitions/checkbox-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useUserNameColumn } from '@core/tables/column-definitions/user-name-column.ts'
import { useI18n } from 'vue-i18n'

export const useUserColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    checkbox: useCheckboxColumn(),
    username: useUserNameColumn({ headerLabel: () => t('username') }),
    firstName: useTextColumn({ headerLabel: () => t('first-name') }),
    lastName: useTextColumn({ headerLabel: () => t('last-name') }),
    email: useTruncatedTextColumn({ headerLabel: () => t('email') }),
    providers: useTruncatedTextColumn({ headerLabel: () => t('providers') }),
    actions: useActionColumn({}),
  }
})
