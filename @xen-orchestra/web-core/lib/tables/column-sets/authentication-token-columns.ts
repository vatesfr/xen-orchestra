import VtsActionsMenu, { type ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useCheckboxColumn } from '@core/tables/column-definitions/checkbox-column.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

const useActionsMenuColumn = defineColumn(() => ({
  renderHead: () => renderHeadCell(),
  renderBody: (actions: ActionItem[]) => h(UiTableCell, { align: 'center' }, () => h(VtsActionsMenu, { actions })),
}))

export const useAuthenticationTokenColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    checkbox: useCheckboxColumn(),
    token: useTextColumn({ headerLabel: () => t('token') }),
    description: useTextColumn({ headerLabel: () => t('description') }),
    lastUse: useDateColumn({ headerLabel: () => t('last-use') }),
    ipAddress: useTextColumn({ headerLabel: () => t('ip-address') }),
    expiration: useDateColumn({ headerLabel: () => t('expiration-date') }),
    actions: useActionsMenuColumn(),
  }
})
