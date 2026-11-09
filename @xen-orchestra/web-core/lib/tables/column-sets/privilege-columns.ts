import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useButtonIconColumn } from '@core/tables/column-definitions/button-icon-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const usePrivilegeColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    index: useLinkColumn(),
    resource: useTextColumn({ headerLabel: () => t('privilege:resource') }),
    scope: useTextColumn({ headerLabel: () => t('privilege:scope') }),
    appliedTo: useNumberColumn({ headerLabel: () => t('privilege:applied-to') }),
    action: useTextColumn({ headerLabel: () => t('privilege:action') }),
    effect: useTagColumn({ headerLabel: () => t('privilege:effect') }),
    edit: useButtonIconColumn({ buttonIcon: 'fa:pencil' }),
    remove: useButtonIconColumn({ buttonIcon: 'fa:trash', buttonAccent: 'danger' }),
    selectItem: useSelectItemColumn(),
  }
})
