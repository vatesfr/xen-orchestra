import type { TextCellProps } from '@core/components/table/cells/VtsTextCell.vue'
import VtsTextCell from '@core/components/table/cells/VtsTextCell.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useTextColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerIcon, config?.headerLabel),
  renderBody: (content: string, props?: TextCellProps) => h(VtsTextCell, props, () => content),
}))
