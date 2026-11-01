import type { HeaderConfig } from '@core/tables/types.ts'
import VtsActionsMenu, { type ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import { h } from 'vue'

// a row's actions menu, with no main action (unlike useActionColumn): a
// disabled button when the row offers none, so the rows line up
export const useVdfActionsColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (actions: ActionItem[]) =>
    renderBodyCell(
      () =>
        actions.length > 0
          ? h(VtsActionsMenu, { actions })
          : h(UiButtonIcon, { icon: 'action:more-actions', accent: 'brand', size: 'small', disabled: true }),
      'center'
    ),
}))
