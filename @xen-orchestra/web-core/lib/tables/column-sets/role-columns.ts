import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useCheckboxColumn } from '@core/tables/column-definitions/checkbox-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useRoleColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    checkbox: useCheckboxColumn(),
    name: useTextColumn({ headerLabel: () => t('name') }),
    group: useTextColumn({ headerLabel: () => t('group') }),
    description: useTextColumn({ headerLabel: () => t('description') }),
    users: useNumberColumn({ headerLabel: () => t('users') }),
    groups: useNumberColumn({ headerLabel: () => t('groups') }),
    privileges: useNumberColumn({ headerLabel: () => t('privileges') }),
    actions: useActionColumn({}),
  }
})
