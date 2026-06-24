import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const useUserColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    username: useLinkColumn({ headerLabel: () => t('username') }),
    firstname: useTruncatedTextColumn({ headerLabel: () => t('firstname') }),
    lastname: useTruncatedTextColumn({ headerLabel: () => t('lastname') }),
    email: useTruncatedTextColumn({ headerLabel: () => t('email') }),
    provider: useTruncatedTextColumn({ headerLabel: () => t('provider') }),
    // actions: useActionColumn({}),
  }
})
