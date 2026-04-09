import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsActionCell from '@core/components/table/cells/VtsActionCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import type { ButtonIconConfig } from '@core/tables/column-definitions/button-icon-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h, toValue } from 'vue'

export type { ActionItem }

export const useActionColumn = defineColumn((config: HeaderConfig & ButtonIconConfig) => ({
  renderHead: () => renderHeadCell(config.headerIcon, config.headerLabel),
  renderBody: (params: { onClick: () => void; actions?: ActionItem[] }) =>
    h(VtsActionCell, {
      buttonIcon: toValue(config.buttonIcon),
      buttonAccent: toValue(config.buttonAccent),
      buttonSize: toValue(config.buttonSize),
      actions: params.actions ?? [],
      onClick: params.onClick,
    }),
}))
