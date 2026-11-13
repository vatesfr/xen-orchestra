import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useButtonColumn } from '@core/tables/column-definitions/button-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useRoleTemplateColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTextColumn({ headerLabel: () => t('name') }),
    description: useTextColumn({ headerLabel: () => t('description') }),
    privileges: useNumberColumn({ headerLabel: () => t('privileges') }),
    select: useButtonColumn({ buttonVariant: 'secondary', buttonSize: 'small' }),
    selectItem: useSelectItemColumn(),
  }
})
