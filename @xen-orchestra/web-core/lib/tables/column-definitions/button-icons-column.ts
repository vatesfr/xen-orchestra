import VtsButtonIconsCell, { type ButtonIconItem } from '@core/components/table/cells/VtsButtonIconsCell.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export type { ButtonIconItem }

export const useButtonIconsColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (buttons: ButtonIconItem[]) => h(VtsButtonIconsCell, { buttons }),
}))
