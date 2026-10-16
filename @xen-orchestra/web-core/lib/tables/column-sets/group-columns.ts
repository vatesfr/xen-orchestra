import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useCheckboxColumn } from '@core/tables/column-definitions/checkbox-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useGroupColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    checkbox: useCheckboxColumn(),
    name: useLinkColumn({ headerLabel: () => t('name') }),
    provider: useTextColumn({ headerLabel: () => t('provider') }),
    users: useNumberColumn({ headerLabel: () => t('users') }),
    roles: useNumberColumn({ headerLabel: () => t('roles') }),
    selectItem: useSelectItemColumn(),
    actions: useActionColumn({}),
  }
})
