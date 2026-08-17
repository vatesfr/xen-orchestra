import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useGroupColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTextColumn({ headerLabel: () => t('name') }),
    provider: useTextColumn({ headerLabel: () => t('provider') }),
    users: useNumberColumn({ headerLabel: () => t('users') }),
    roles: useNumberColumn({ headerLabel: () => t('roles') }),
  }
})
