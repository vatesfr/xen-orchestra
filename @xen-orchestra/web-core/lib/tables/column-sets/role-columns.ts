import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useRoleColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTextColumn({ headerLabel: () => t('name') }),
    description: useTextColumn({ headerLabel: () => t('description') }),
    users: useNumberColumn({ headerLabel: () => t('users') }),
    groups: useNumberColumn({ headerLabel: () => t('groups') }),
    privileges: useNumberColumn({ headerLabel: () => t('privileges') }),
    selectItem: useSelectItemColumn(),
  }
})
